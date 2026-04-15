import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Boundary } from '@/components/common';
import { CHECKOUT_STEP_1, CHECKOUT_STEP_3 } from '@/constants/routes';
import { Form, Formik } from 'formik';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { setShippingDetails } from '@/redux/actions/checkoutActions';
import * as Yup from 'yup';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';
import ShippingForm from './ShippingForm';
import ShippingTotal from './ShippingTotal';

const FormSchema = Yup.object().shape({
  fullname: Yup.string()
    .required('Nombre completo es requerido.')
    .min(2, 'Nombre completo debe contener más de 2 caracteres.')
    .max(60, 'Nombre completo debe tener menos de 60 caracteres.'),
  email: Yup.string()
    .email('Email no es válido.')
    .required('Email es requerido.'),
  address: Yup.string()
    .required('Dirección de envío es requerida.'),
  mobile: Yup.object()
    .shape({
      country: Yup.string(),
      countryCode: Yup.string(),
      dialCode: Yup.string().required('Número de teléfono es requerido.'),
      value: Yup.string().required('Número de teléfono es requerido.')
    })
    .required('Número de teléfono es requerido.'),
  isDone: Yup.boolean()
});

const ShippingDetails = ({ profile, shipping, subtotal, basket }) => {
  useDocumentTitle('Check Out Paso 2 | Bodnes');
  useScrollTop();
  const dispatch = useDispatch();
  const history = useHistory();

  const initFormikValues = {
    fullname: (shipping && shipping.fullname) || (profile && profile.fullname) || '',
    email: (shipping && shipping.email) || (profile && profile.email) || '',
    address: (shipping && shipping.address) || (profile && profile.address) || '',
    mobile: (shipping && shipping.mobile) || (profile && profile.mobile) || {
      country: 'Argentina',
      countryCode: 'AR',
      dialCode: '+54',
      value: ''
    },
    isDone: (shipping && shipping.isDone) || false
  };

  const onSubmitForm = (form) => {
    // Guardar los detalles de envío en Redux
    dispatch(setShippingDetails({
      fullname: form.fullname,
      email: form.email,
      address: form.address,
      mobile: form.mobile,
      isDone: true
    }));

    // Redirigir al siguiente paso (CHECKOUT_STEP_3)
    history.push(CHECKOUT_STEP_3);
  };

  return (
    <Boundary>
      <div className="checkout">
        <StepTracker current={2} />
        <div className="checkout-step-2">
          <h3 className="text-center">detalles del envío </h3>
          <Formik
            initialValues={initFormikValues}
            validateOnChange
            validationSchema={FormSchema}
            onSubmit={onSubmitForm}
          >
            {() => (
              <Form>
                <ShippingForm />
                <br />
                {/*  ---- TOTAL --------- */}
                <ShippingTotal subtotal={subtotal} />
                <br />
                {/*  ----- NEXT/PREV BUTTONS --------- */}
                <div className="checkout-shipping-action">
                  <button
                    className="button button-muted"
                    onClick={() => history.push(CHECKOUT_STEP_1)}
                    type="button"
                  >
                    <ArrowLeftOutlined />
                    &nbsp;
                    Atras
                  </button>
                  <button
                    className="button button-icon"
                    type="submit"
                  >
                    SIGUIENTE PASO
                    &nbsp;
                    <ArrowRightOutlined />
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </Boundary>
  );
};

ShippingDetails.propTypes = {
  subtotal: PropType.number.isRequired,
  basket: PropType.arrayOf(PropType.object).isRequired,
  profile: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object
  }),
  shipping: PropType.shape({
    fullname: PropType.string,
    email: PropType.string,
    address: PropType.string,
    mobile: PropType.object,
    isDone: PropType.bool
  })
};

ShippingDetails.defaultProps = {
  profile: {
    fullname: '',
    email: '',
    address: '',
    mobile: {
      country: 'Argentina',
      countryCode: 'AR',
      dialCode: '+54',
      value: ''
    }
  },
  shipping: {
    fullname: '',
    email: '',
    address: '',
    mobile: {
      country: 'Argentina',
      countryCode: 'AR',
      dialCode: '+54',
      value: ''
    },
    isDone: false
  }
};

export default withCheckout(ShippingDetails);




