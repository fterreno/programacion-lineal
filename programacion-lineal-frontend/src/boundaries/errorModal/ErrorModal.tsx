import styles from './ErrorModal.module.css';

interface ErrorModalProps {
  titulo: string;
  descripcion: string;
  onClose: () => void;
}

const ErrorModal = ({ titulo, descripcion, onClose }: ErrorModalProps) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnCerrar} onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 className={styles.titulo}>{titulo}</h2>
        <hr className={styles.separador} />
        <p className={styles.descripcion}>{descripcion}</p>
      </div>
    </div>
  );
};

export default ErrorModal;
