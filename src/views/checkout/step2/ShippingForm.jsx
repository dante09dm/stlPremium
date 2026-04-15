/* eslint-disable jsx-a11y/label-has-associated-control */
import { CustomInput, CustomMobileInput } from '@/components/formik';
import { Field, useFormikContext } from 'formik';
import React from 'react';

const ShippingForm = () => {
  const { values } = useFormikContext();
  return (
    <div className="checkout-shipping-wrapper">
      <div className="checkout-shipping-form">
        <div className="checkout-fieldset">
          <div className="d-block checkout-field">
            <Field
              name="fullname"
              type="text"
              label="* Nombre completo"
              placeholder="Ingresá nombre completo"
              component={CustomInput}
              style={{ textTransform: 'capitalize' }}
            />
          </div>
          <div className="d-block checkout-field">
            <Field
              name="email"
              type="email"
              label="* Email"
              placeholder="Ingresá tu Email"
              component={CustomInput}
            />
          </div>
        </div>
        <div className="checkout-fieldset">
          <div className="d-block checkout-field">
            <Field
              name="address"
              type="text"
              label="* Dirección de envío"
              placeholder="Ingresá dirección de envío"
              component={CustomInput}
            />
          </div>
          <div className="d-block checkout-field">
            <CustomMobileInput name="mobile" defaultValue={values.mobile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingForm;

