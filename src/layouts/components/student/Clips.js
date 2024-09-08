import React, { useEffect, useState } from 'react'
import PlayVideo from './PlayVideo';
import Modal from 'src/pages/components/modal/Modal';
import authConfig from 'src/configs/auth'
import { FaDownload, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import styles from './clip.module.css';
import ConfirmModal from './ConfirmModal';
import { Tooltip } from "react-tippy";
import 'react-toastify/dist/ReactToastify.css';
import 'react-tippy/dist/tippy.css'
import { getSignedURL } from 'src/utils/utils';


export default function Clips({ activeCenterContainerTab, trainee_id, isOpen }) {

  const [isOpenPlayVideo, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null);
  const [clips, setClips] = useState([]);

  const handleCloseVideoPlayer = () => {
    setIsOpen(false)
  }

  // useEffect(() => {
  //   if (isOpen) getMyClips()
  // }, [isOpen, activeCenterContainerTab])
  useEffect(() => {
    getMyClips()
  }, [])

  const getTraineeClips = async (params) => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedToken}`
      },
      body: JSON.stringify(params),
    };
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/common/get-clips', options)
      // return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/trainer/get-trainee-clips', options)
      .then(data => data.json()).then(res => res.data).catch(e => e);
  }

  const deleteClip = async (payload) => {
    try {
      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          "Access-Control-Allow-Origin": "*",
          'Authorization': `Bearer ${localStorage.getItem(authConfig.storageTokenKeyName)}`
        },
      };
      return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/common/delete-clip/${payload.id}`, options)
        .then(data => data.json()).then(async res => {
          if (res?.success) {
            toast.success(res?.message);
            setIsConfirmModalOpen(false)
            setSelectedId(null);
            await getMyClips();
          } else {
            toast.error(res?.message);
          }
        }).catch(e => e);
    } catch (err) {
      throw err;
    }
  };

  const getMyClips = async () => {
    if (trainee_id) {
      // const res = await getTraineeClips({ trainer_id: trainee_id })
      const res = await getTraineeClips({ trainee_id })
      let temp = res?.map((clp) => { return { ...clp, show: true } })
      setClips([...temp])
    }
  }
  console.log("res?.data===", clips)

  const handleDelete = async (id) => {
    const res = await deleteClip({ id });
    console.log(res, 'res')
    // if (res?.success) {
    //   toast.success(res?.message);
    //   setIsConfirmModalOpen(false)
    //   setSelectedId(null);
    //   await getMyClips();
    // } else {
    //   toast.error(res?.message);
    // }
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false)
    setSelectedId(null)
  }

  return (
    <>
      <ToastContainer />
      <div className="media-gallery portfolio-section grid-portfolio">
        {clips?.length ? clips?.map((cl, ind) =>
          <div key={ind} className={`collapse-block ${!cl?.show ? "" : "open"}`}>
            <h5
              className="block-title"
              onClick={() => {
              }}
            >
              {cl?._id}
              <label className="badge badge-primary sm ml-2" style={{ backgroundColor: "navy", marginLeft: "2px", padding: "4px", fontWeight: "600", borderRadius: "5px", color: "white" }}>{cl?.clips?.length}</label>
            </h5>
            {/*  NORMAL  STRUCTURE END  */}
            {/* <div className={`block-content ${!cl?.show ? "d-none" : ""}`}>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {cl?.clips.map((clp, index) => (
                  <div
                    key={index}
                    className={`col-4 p-1`}
                    // style={{ borderRadius: 5 }}
                    style={{
                      borderRadius: 5, flex: " 0 0 33.33333333%",
                      maxWidth: "33.33333333%"
                    }}
                    onClick={() => {
                      setSelectedVideo(generateVideoURL(clp))
                      setIsOpen(true)
                    }}
                  >
                    <div
                      style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "160px",
                        maxHeight: "130px",
                        border: "2px solid rgb(0, 0, 128)",
                        borderRadius: "5px",
                        margin: "2px",
                        textAlign: "center",
                      }}>
                      <h5 style={{ textAlign: "center", padding: 0, margin: 0, paddingBottom: "4px", paddingTop: "2px" }}>
                        {clp?.title}
                      </h5>
                      <video
                        id="Home-page-vid"
                        // width="160px"
                        // height="80px"
                        style={{
                          padding: "2px",
                          //  paddingRight: "4px",
                          maxWidth: "160px",
                          maxHeight: "80px",
                          width: "auto",
                          height: "auto",
                        }}
                      >
                        <source src={generateVideoURL(clp)} />
                      </video>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            <div className={`block-content ${!cl?.show ? "d-none" : ""}`}>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {cl?.clips.map((clp, index) => (
                  <div
                    key={index}
                    className={`col-4 p-1 video-container`}
                    style={{
                      borderRadius: 5,
                      flex: " 0 0 33.33333333%",
                      maxWidth: "33.33333333%",
                      position: "relative"
                    }}
                    onClick={() => {
                      setSelectedVideo(getSignedURL(clp?.file_name))
                      setIsOpen(true);
                    }}
                  >
                    <div
                      style={{
                        margin: "2px",
                        textAlign: "center",
                        maxHeight: "220px",
                      }}
                      className={styles.hoverVideo}
                    >
                      {/* <h5
                        style={{
                          textAlign: "center",
                          paddingBottom: "4px",
                          paddingTop: "2px",
                        }}
                      >
                        {clp?.title}
                      </h5> */}
                      <Tooltip
                        title={clp?.title}
                        position="top"
                        trigger="mouseenter"
                      >
                        <video
                          id="Home-page-vid"
                          poster={getSignedURL(clp?.thumbnail)}
                          style={{
                            position: "relative",
                            height: "180px",
                            width: "100%",
                            border: "4px solid #b4bbd1",
                            borderRadius: "5px",
                            objectFit: "cover",
                          }}
                        >
                          <source src={getSignedURL(clp?.file_name)} />
                        </video>
                        <div
                          className={styles.downloadDelete}
                          style={{
                            position: "absolute",
                            top: "3.5%",
                            right: "4.5%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            backgroundColor: "#333",
                            color: "#fff",
                            padding: "8px",
                            fontSize: "16px",
                            zIndex: '8'
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleDelete(clp?._id);
                              setIsConfirmModalOpen(true);
                              setSelectedId(clp?._id);
                            }}
                            style={{
                              margin: '3px auto',
                              cursor: 'pointer'

                            }}
                          >
                            <FaTrash />
                          </div>
                          <div
                            style={{
                              margin: '3px auto'
                            }}
                          >
                            <a
                              href={getSignedURL(clp?.file_name)}
                              download={true}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                color: '#fff',
                                fontSize: '16px'
                              }}
                              target="_self"
                            >
                              <FaDownload />
                            </a>
                          </div>
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <h5 className="block-title">  No Data Found</h5>
          </div>
        </>}
      </div>

      {/* <div style={{ display: "flex" }}>

        {recentStudentClips?.map((clp, index) => (
          <div
            key={index}
            className={`col-4 p-1`}
            style={{
              borderRadius: 5,
              flex: "33.333333%",
              maxWidth: "33.333333%",
              padding: "0.25rem !important"
            }}
            onClick={() => {
              setSelectedVideo(generateVideoURL(clp))
              setIsOpen(true)
            }}
          >
            <div
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "160px",
                maxHeight: "130px",
                border: "2px solid rgb(0, 0, 128)",
                borderRadius: "5px",
                margin: "2px",
                textAlign: "center",
              }}>

              <video
                id="Home-page-vid"
                style={{
                  padding: "2px",
                  maxWidth: "160px",
                  maxHeight: "80px",
                  width: "auto",
                  height: "auto",
                }}
              >
                <source src={generateVideoURL(clp)} />
              </video>
              <h5 style={{ textAlign: "center", paddingBottom: "4px", paddingTop: "2px" }}>
                {clp?.title}
              </h5>
            </div>
          </div>
        ))}

      </div> */}

      {/* ********************************* */}

      <Modal handleClose={handleCloseVideoPlayer} open={isOpenPlayVideo} maxWidth="xl">
        <PlayVideo handleCloseVideoPlayer={handleCloseVideoPlayer} selectedVideo={selectedVideo} />
      </Modal>

      {
        isConfirmModalOpen &&
        (
          <ConfirmModal
            isModelOpen={isConfirmModalOpen}
            setIsModelOpen={setIsConfirmModalOpen}
            selectedId={selectedId}
            deleteFunc={handleDelete}
            closeModal={handleCloseModal}
          />
        )
      }
    </>
  )
}
