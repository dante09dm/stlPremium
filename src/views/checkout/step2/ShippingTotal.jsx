import { useFormikContext } from 'formik';
import { displayMoney } from '@/helpers/utils';
import PropTypes from 'prop-types';
import React from 'react';

const ShippingTotal = ({ subtotal }) => {
  const { values } = useFormikContext();


  // Ensure subtotal is a valid number (fallback to 0 if invalid)
  const safeSubtotal = isNaN(Number(subtotal)) ? 0 : Number(subtotal);
  const shippingCost = values.isInternational ? 50 : 0;
  const totalAmount = safeSubtotal + shippingCost;


  return (
    <div className="checkout-total d-flex-end padding-right-m">
      <table>
        <tbody>
          <tr>
            <td>
              <span className="d-block margin-0 padding-right-s text-right">
                Total: &nbsp;
              </span>
            </td>
            <td>
              <h2 className="basket-total-amount text-right">
                {displayMoney(totalAmount)}
              </h2>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

ShippingTotal.propTypes = {
  subtotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) // Allow number or string
};

ShippingTotal.defaultProps = {
  subtotal: 0
};

export default ShippingTotal;


