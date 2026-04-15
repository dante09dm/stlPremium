/* eslint-disable indent */
import {
  ADD_PRODUCT,
  EDIT_PRODUCT,
  GET_PRODUCTS,
  REMOVE_PRODUCT,
  SEARCH_PRODUCT
} from '@/constants/constants';
import { ADMIN_PRODUCTS } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import {
  all, call, put, select
} from 'redux-saga/effects';
import { setLoading, setRequestStatus } from '@/redux/actions/miscActions';
import { history } from '@/routers/AppRouter';
import firebase from '@/services/firebase';
import {
  addProductSuccess,
  clearSearchState,
  editProductSuccess,
  getProductsSuccess,
  removeProductSuccess,
  searchProductSuccess
} from '../actions/productActions';

function* initRequest() {
  yield put(setLoading(true));
  yield put(setRequestStatus(null));
}

function* handleError(e) {
  yield put(setLoading(false));
  yield put(setRequestStatus(e?.message || 'Failed to fetch products'));
  console.log('ERROR: ', e);
}

function* handleAction(location, message, status) {
  if (location) yield call(history.push, location);
  yield call(displayActionMessage, message, status);
}

/**
 * Uploads a single model's GLB + STL parts to Firebase Storage.
 * Only uploads files that have a new fileObject — keeps existing URLs otherwise.
 * Returns { name, glbURL, stlURLs: [...] }
 */
function* uploadModel(productKey, modelIndex, model) {
  const basePath = `products/${productKey}/models/${modelIndex}`;

  // GLB: upload if new file provided, else keep existing URL
  let glbURL = model.glbURL || null;
  if (model.glbFileObject) {
    glbURL = yield call(firebase.storeFile, `${basePath}/preview.glb`, model.glbFileObject);
  }

  // STL parts: upload each part that has a new fileObject, keep existing URL otherwise
  const stlParts = model.stlParts || [];
  const stlURLs = yield all(
    stlParts.map((part, j) => {
      if (part.fileObject) {
        return call(firebase.storeFile, `${basePath}/stl_${j}.stl`, part.fileObject);
      }
      // No new file — return the existing URL as a resolved value
      return call(() => Promise.resolve(part.url || null));
    })
  );

  return {
    name: model.name || `Modelo ${modelIndex + 1}`,
    glbURL,
    stlURLs
  };
}

function* productSaga({ type, payload }) {
  switch (type) {
    // ─────────────────────────────────────────────
    case GET_PRODUCTS:
      try {
        yield initRequest();
        const state = yield select();
        const result = yield call(firebase.getProducts, payload);

        if (result.products.length === 0) {
          handleError('No items found.');
        } else {
          yield put(getProductsSuccess({
            products: result.products,
            lastKey: result.lastKey ? result.lastKey : state.products.lastRefKey,
            total: result.total ? result.total : state.products.total
          }));
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;

    // ─────────────────────────────────────────────
    case ADD_PRODUCT: {
      try {
        yield initRequest();

        const key = yield call(firebase.generateKey);

        // Upload preview image (PNG) if provided
        let previewImageURL = null;
        if (payload.previewImg?.fileObject) {
          previewImageURL = yield call(
            firebase.storeFile,
            `products/${key}/preview.jpg`,
            payload.previewImg.fileObject
          );
        }

        // Upload all models (GLB + STL) in parallel
        const uploadedModels = yield all(
          payload.models.map((model, i) => call(uploadModel, key, i, model))
        );

        const product = {
          name: payload.name,
          category: payload.category,
          price: payload.price,
          description: payload.description,
          previewImageURL,
          models: uploadedModels,          // [{ name, glbURL, stlURLs: [...] }]
          availableColors: payload.availableColors || null,
          isFeatured: payload.isFeatured || false,
          isRecommended: payload.isRecommended || false,
          dateAdded: new Date().getTime()
        };

        yield call(firebase.addProduct, key, product);
        yield put(addProductSuccess({ id: key, ...product }));
        yield handleAction(ADMIN_PRODUCTS, 'Producto agregado correctamente', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(undefined, `Error al agregar producto: ${e?.message}`, 'error');
      }
      break;
    }

    // ─────────────────────────────────────────────
    case EDIT_PRODUCT: {
      try {
        yield initRequest();

        const { updates, id } = payload;
        let newUpdates = { ...updates };

        // Upload preview image (PNG) — solo si hay nuevo archivo, sino conserva la URL existente
        let previewImageURL = updates.previewImg?.url || updates.previewImageURL || null;
        if (updates.previewImg?.fileObject) {
          previewImageURL = yield call(
            firebase.storeFile,
            `products/${id}/preview.jpg`,
            updates.previewImg.fileObject
          );
        }

        // Upload each model — uploadModel only sube los archivos nuevos,
        // preserva las URLs existentes para los que no cambiaron
        const uploadedModels = yield all(
          updates.models.map((model, i) => call(uploadModel, id, i, model))
        );

        newUpdates = {
          ...newUpdates,
          previewImageURL,
          models: uploadedModels,
          availableColors: updates.availableColors || null
        };
        // Limpiar campo interno antes de guardar en Firestore
        delete newUpdates.previewImg;

        yield call(firebase.editProduct, id, newUpdates);
        yield put(editProductSuccess({ id, updates: newUpdates }));
        yield handleAction(ADMIN_PRODUCTS, 'Producto editado correctamente', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(undefined, `Error al editar producto: ${e?.message}`, 'error');
      }
      break;
    }

    // ─────────────────────────────────────────────
    case REMOVE_PRODUCT: {
      try {
        yield initRequest();
        yield call(firebase.removeProduct, payload);
        yield put(removeProductSuccess(payload));
        yield put(setLoading(false));
        yield handleAction(ADMIN_PRODUCTS, 'Producto eliminado correctamente', 'success');
      } catch (e) {
        yield handleError(e);
        yield handleAction(undefined, `Error al eliminar producto: ${e?.message}`, 'error');
      }
      break;
    }

    // ─────────────────────────────────────────────
    case SEARCH_PRODUCT: {
      try {
        yield initRequest();
        yield put(clearSearchState());

        const state = yield select();
        const result = yield call(firebase.searchProducts, payload.searchKey);

        if (result.products.length === 0) {
          yield handleError({ message: 'No se encontraron productos.' });
          yield put(clearSearchState());
        } else {
          yield put(searchProductSuccess({
            products: result.products,
            lastKey: result.lastKey ? result.lastKey : state.products.searchedProducts.lastRefKey,
            total: result.total ? result.total : state.products.searchedProducts.total
          }));
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;
    }

    default:
      throw new Error(`Unexpected action type ${type}`);
  }
}

export default productSaga;