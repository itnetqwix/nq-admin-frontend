import React from 'react';
import styles from './clip.module.css';

const ConfirmModal = ({
    isModelOpen,
    setIsModelOpen,
    selectedId,
    deleteFunc,
    closeModal,
}) => {
    return (
        <>
            {isModelOpen && (
                <div className={styles.customModalOverlay}>
                    <div className={styles.customModalContent}>
                        <h5 className={styles.modalTitle}>
                            Are you sure you want to delete it?
                        </h5>
                        <div className={styles.modalButtons}>
                            <button
                                className={styles.btn}
                                style={{
                                    backgroundColor: "rgb(23 62 0)",
                                    border: "1px solid rgb(23 62 0)"
                                }}
                                onClick={() => closeModal()}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btn}
                                style={{
                                    backgroundColor: "rgb(123 16 3)",
                                    border: "1px solid rgb(123 16 3)"
                                }}
                                onClick={() => deleteFunc(selectedId)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConfirmModal;
