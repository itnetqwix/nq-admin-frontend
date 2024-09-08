import React from "react";
import { Modal as ReactStrapCustomModal, ModalBody, ModalFooter } from "reactstrap";

import styles from "styles/common.module.css";

const ReactStrapModal = ({
    isOpen,
    id,
    element,
    toggle,
    footer = <></>,
    width,
    allowFullWidth = false,
    height,
    overflowHidden = false,
    minHeight = false,
}) => {
    return (
        <ReactStrapCustomModal
            className={`${allowFullWidth
                ? styles["react-strap-modal-full"]
                : styles["custom-react-strap-modal-full"]
                } `}
            isOpen={isOpen}
            toggle={toggle}
            key={id}
            style={{
                width,
                height,
                overflow: overflowHidden ? "hidden" : null,
                margin: "0px",
                minHeight: minHeight ? "100vh" : null,
            }}
        >
            <ModalBody>{element}</ModalBody>
            <ModalFooter>{footer}</ModalFooter>
        </ReactStrapCustomModal>
    );
};

export default ReactStrapModal;