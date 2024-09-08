import React, { useEffect, useState } from 'react'
import { deleteReports, deleteSavedSession, getAllSavedSessions, reports } from './clips.api';
import { AccountType } from 'src/utils/constant';
import { getSignedURL } from 'src/utils/utils';
import { FaDownload, FaTrash } from 'react-icons/fa';
import styles from './clip.module.css';
import ConfirmModal from './ConfirmModal';
import { ToastContainer, toast } from 'react-toastify';
import Modal from 'src/pages/components/modal/Modal';
import PlayVideo from './PlayVideo';
export default function Reports({ accountType, activeCenterContainerTab, trainee_id, isOpen }) {
  const [activeTab, setActiveTab] = useState("media");
  const [reportsData, setReportsData] = useState([]);
  const [isOpenPDF, setIsOpenPDF] = useState(false);
  const [reportName, setReportName] = useState("");
  const [isOpenReport, setIsOpenReport] = useState(false);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedRecordingId, setselectedRecordingId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [screenShots, setScreenShots] = useState([]);
  const [reportObj, setReportObj] = useState({ title: "", topic: "" });
  const handleVideoLoad = (event) => {
    const video = event.target;
    const aspectRatio = video.videoWidth / video.videoHeight;

    // Set width and height based on aspect ratio
    if (aspectRatio > 1) {
      setVideoDimensions({ width: "100%", height: "70%" });
    } else {
      setVideoDimensions({ width: "470px", height: "587px" });
    }
  };

  useEffect(() => {
    getMyClips()
  }, [isOpen])

  function extractDateParts(dateString) {
    const date = new Date(dateString);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }
  const getMyClips = async () => {
    const res3 = await reports({ user_id: trainee_id });
    const savedSessions = await getAllSavedSessions({ user_id: trainee_id })
    const organizedData = savedSessions.data.reduce((acc, obj) => {
      const createdAtDate = extractDateParts(obj.createdAt);
      const key = `${createdAtDate.year}-${createdAtDate.month}-${createdAtDate.day}`;
      if (!acc[key]) {
        acc[key] = {
          _id: {
            year: createdAtDate.year,
            month: createdAtDate.month,
            day: createdAtDate.day
          },
          report: [],
          date: new Date(obj.createdAt)
        };
      }

      acc[key].report.push(obj);

      return acc;
    }, {});

    const result = Object.values(organizedData).map(item => ({
      ...item,
      show: true,
    }));

    var temp = res3?.result

    temp = temp.map(vl => {
      return { ...vl, show: true, date: vl?.report?.length ? new Date(vl?.report[0]?.createdAt) : new Date() }
    });

    // setReportsData([...result, ...temp])

    const groupedReports = {};

    [...result, ...temp]?.forEach((item) => {
      const { _id, report, ...rest } = item;

      const idString = JSON.stringify(_id);

      if (groupedReports[idString]) {

        groupedReports[idString].report.push(...report);
      } else {

        groupedReports[idString] = { _id, report, ...rest };
      }
    });

    const mergedData = Object.values(groupedReports);

    setReportsData(mergedData?.sort((a, b) => new Date(b.date) - new Date(a.date)))

  }
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate() < 10 ? date.getDate() : `0${date.getDate()}`;
    const month = (date.getMonth() + 1) < 10 ? date.getMonth() + 1 : `0${date.getMonth() + 1}`;
    const formattedDate = `${day}/${month}/${date.getFullYear()}`;
    return formattedDate;
  }

  const handleSessionDelete = async (id) => {
    const res = await deleteSavedSession({ id });
    if (res?.success) {
      await getMyClips();
      toast.success(res?.message);
      setIsConfirmModalOpen(false);
      setselectedRecordingId(null);
      (null);
    } else {
      toast.error(res?.message);
    }
  };
  const handleReportDelete = async (id) => {
    const res = await deleteReports({ id });
    if (res?.result?.code === 200) {
      await getMyClips();
      toast.success(res?.result?.msg);
      setIsConfirmModalOpen(false);
      setSelectedReportId(null);
    } else {
      toast.error(res?.result?.msg);
    }
  };

  const handleCloseModal = () => {
    setIsConfirmModalOpen(false)
    setSelectedReportId(null)
    setselectedRecordingId(null)
  }

  const handleCloseVideoPlayer = () => {
    setIsRecordingOpen(false)
  }
  return (
    <>
      <ToastContainer />
      <div className="media-gallery portfolio-section grid-portfolio">
        {reportsData?.length ? reportsData?.map((cl, ind) =>
          <div className={`collapse-block ${!cl?.show ? "" : "open"}`} key={ind}>
            <h5
              className="block-title"
            >
              <label className={styles.dateLabel}>{`${cl?._id?.month}/${cl?._id?.day}/${cl?._id?.year}`}</label>
            </h5>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {/* Render videos with session data */}
              {cl?.report.map((clp, index) => {
                return clp.hasOwnProperty("reportData") ?
                  <div className={`col-4`}
                    key={index}
                    //  style={{ whiteSpace: "nowrap" }}
                    style={{
                      borderRadius: 5,
                      flex: " 0 0 33.33333333%",
                      maxWidth: "33.33333333%",
                      position: "relative",
                      whiteSpace: "nowrap"
                    }}>
                    {/* Render video */}
                    <div >
                      <div style={{ textAlign: "center" }}>
                        <dd>GAME PLAN with
                          <div>
                            <strong>{clp?.[accountType === AccountType?.TRAINER ? "trainee" : "trainer"]?.fullname}</strong>
                          </div>
                        </dd>
                      </div>
                      <div style={{ marginBottom: "5px", }}>
                        <dd
                          className={styles.hoverVideo}
                          style={{ cursor: "pointer", textAlign: "center", position: "relative" }}
                          onClick={() => {
                            if (accountType === "Trainer") {
                              setCurrentReportData({ session: clp?.session?._id, trainer: clp?.trainer?._id, trainee: clp?.trainee?._id })
                              setIsOpenReport(true)
                            } else {
                              setIsOpenPDF(true)
                              setReportName(clp?.session?.report)
                            }
                          }}
                        >
                          {
                            clp?.reportData?.length ?
                              <>
                                <img
                                  src={getSignedURL(clp?.reportData[0]?.imageUrl)}
                                  alt={clp?.reportData[0]?.title}
                                  style={{ width: "100%", height: "150px", position: "relative" }}
                                />
                                <div
                                  className={styles.downloadDelete}
                                  style={{
                                    position: "absolute",
                                    top: "2.5%",
                                    right: "1.5%",
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
                                      // handleReportDelete(clp?._id);
                                      setIsConfirmModalOpen(true);
                                      setSelectedReportId(clp?._id);
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
                                      href={getSignedURL(clp?.reportData[0]?.imageUrl)}
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

                              </>
                              :
                              <img
                                src="/icons/FileSee.png"
                                alt="FileSee Icon"
                                style={{ width: "30px", height: "30px" }}
                              />
                          }
                          {accountType === "Trainer" ? "" : ""}
                        </dd>
                      </div>
                    </div>
                  </div>
                  :
                  <div
                    className={`col-4`}
                    key={index}
                    // style={{ whiteSpace: "nowrap" }}
                    style={{
                      borderRadius: 5,
                      flex: " 0 0 33.33333333%",
                      maxWidth: "33.33333333%",
                      position: "relative",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <div
                    // style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                      <div style={{
                        wordBreak: 'break-all'
                      }}>
                        <dd>SESSION RECORDING with
                          <div style={{ textAlign: "center" }}>
                            <strong>{accountType === AccountType.TRAINER ? clp?.trainee_name : clp?.trainer_name} </strong>
                          </div>
                        </dd>
                      </div>

                      <div style={{ marginBottom: "5px" }}>
                        <dd
                          className={styles.hoverVideo}
                          style={{ cursor: "pointer", textAlign: "center" }}
                          onClick={() => {
                            setSelectedVideo(getSignedURL(clp?.file_name))
                            setIsRecordingOpen(true)
                          }}
                        >
                          <video
                            // id={styles.HomePageVid}
                            // width="160px"
                            // height="80px"
                            style={{
                              padding: "2px",
                              position: 'relative',
                              // maxWidth: "250px",
                              height: "150px",
                              // width: "auto",
                              // height: "auto",
                              width: "100%",
                              border: "4px solid #b4bbd1",
                              borderRadius: "5px",
                              objectFit: "cover"
                            }}
                          >
                            <source src={getSignedURL(clp?.file_name)} type="video/webm" />
                          </video>
                          <div
                            className={styles.downloadDelete}
                            style={{
                              position: "absolute",
                              top: "24.5%",
                              right: "1.5%",
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
                                // handleSessionDelete(clp?._id);
                                setIsConfirmModalOpen(true);
                                setselectedRecordingId(clp?._id);
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
                        </dd>
                      </div>

                    </div>
                  </div>
              })}
            </div>
          </div>
        ) :
          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <h5 className="block-title">No Data Found</h5>
          </div>}
      </div>

      <Modal handleClose={handleCloseVideoPlayer} open={isRecordingOpen} maxWidth="xl">
        <PlayVideo handleCloseVideoPlayer={handleCloseVideoPlayer} selectedVideo={selectedVideo} />
      </Modal>

      {/* <ReportModal
        currentReportData={currentReportData}
        isOpenReport={isOpenReport}
        setIsOpenReport={setIsOpenReport}
        screenShots={screenShots}
        setScreenShots={setScreenShots}
        reportObj={reportObj}
        setReportObj={setReportObj}
      /> */}

      {
        isConfirmModalOpen &&
        (
          <ConfirmModal
            isModelOpen={isConfirmModalOpen}
            setIsModelOpen={setIsConfirmModalOpen}
            selectedId={selectedReportId || selectedRecordingId}
            deleteFunc={selectedReportId ? handleReportDelete : handleSessionDelete}
            closeModal={handleCloseModal}
          />
        )
      }
    </>

  )
}
