import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal } from '@/components/common';
import { useFormikContext } from 'formik';
import PropType from 'prop-types';
import React, { useState } from 'react';

const ConfirmModal = ({ onConfirmUpdate, modal }) => {
  const [password, setPassword] = useState('');
  const { values } = useFormikContext();

  return (
    <Modal
      isOpen={modal.isOpenModal}
      onRequestClose={modal.onCloseModal}
    >
      <div className="text-center padding-l">
        <h4>Confirmar actualización</h4>
        <p>
         para continuar actualizando tu perfil &nbsp;
          <strong>email</strong>
          ,
          <br />
          Por favor confirme ingresando su contraseña
        </p>
        <input
          className="input-form d-block"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingesá tu contaseña"
          required
          type="password"
          value={password}
        />
      </div>
      <br />
      <div className="d-flex-center">
        <button
          className="button"
          onClick={() => {
            onConfirmUpdate(values, password);
            modal.onCloseModal();
          }}
          type="button"
        >
          <CheckOutlined />
          &nbsp;
          Confirm
        </button>
      </div>
      <button
        className="modal-close-button button button-border button-border-gray button-small"
        onClick={modal.onCloseModal}
        type="button"
      >
        <CloseOutlined />
      </button>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  onConfirmUpdate: PropType.func.isRequired,
  modal: PropType.shape({
    onCloseModal: PropType.func,
    isOpenModal: PropType.bool
  }).isRequired
};

export default ConfirmModal;
