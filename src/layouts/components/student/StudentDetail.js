import React from "react";
import ClipsAndGamePlan from "./ClipsAndGamePlan";
import { dynamicImageURL } from "src/utils/utils";

const StudentDetail = ({ data, isOpen }) => {

  const trainee_id = data?._id;

  function addSuffix(name) {
    if (name) {
      return `${name}'s`
    }
    return ""
  }

  return (
    <div>
      <h3 style={{ textAlign: 'center' }}>This is {addSuffix(data?.fullname)} clips</h3>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingTop: "20px"
      }}>
        <div className="card rounded trainer-profile-card" style={{
          width: "350px",
          maxHeight: "300px",
          border: "2px solid rgb(0, 0, 128)",
          borderRadius: "5px"
        }}>
          <div className="card-body" style={{ display: "flex", justifyContent: "center" }}>
            <div className="row">
              <div className="col-12 d-flex justify-content-center align-items-center">
                <img
                  className="card-img-top"
                  src={dynamicImageURL(data?.profile_picture) ?? 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'}
                  alt="Card image cap"
                  style={{
                    padding: "10px",
                    borderRadius: "20px",
                    height: '100%',
                    objectFit: 'cover',
                    maxHeight: '200px',
                    minHeight: '200px',
                    maxWidth: '190px',
                    minWidth: '190px'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://e7.pngegg.com/pngimages/799/987/png-clipart-computer-icons-avatar-icon-design-avatar-heroes-computer-wallpaper-thumbnail.png'
                  }}
                />
              </div>
              <div className="col-12 text-center mt-3" style={{ textAlign: "center" }}>
                <h3>{data?.fullname}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="card rounded trainer-profile-card" style={{
          maxWidth: "60%",
          width: '60%',
          height: "100%",
          padding: '20px',
          border: "2px solid rgb(0, 0, 128)",
          borderRadius: "5px"
        }}>
          <ClipsAndGamePlan accountType={data?.account_type} trainee_id={trainee_id} isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
