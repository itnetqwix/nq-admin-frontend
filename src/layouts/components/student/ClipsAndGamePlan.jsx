import React, { useEffect, useState } from "react";
import {
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from "reactstrap";
import Clips from "./Clips";
import Reports from "./Reports";

const allTabs = [
  {
    name: "My Clips",
    value: "myClips",
    component: Clips,
  },
  {
    name: "Game Plans",
    value: "gamePlans",
    component: Reports,
  },
];

const ClipsAndGamePlan = ({ accountType, trainee_id, isOpen }) => {
  const [activeTab, setActiveTab] = useState(allTabs[0]?.value);

  const toggleTab = (tabValue) => {
    console.log('Toggle Tab:', tabValue);
    if (activeTab !== tabValue) {
      setActiveTab(tabValue);
    }
  };

  console.log("======activeTab", activeTab)

  return (
    <>
      <div id="navstudent" className="clip-and-game-plan">
        <div className="theme-tab sub-nav">
          <Nav tabs>
            {allTabs?.map(
              (el) =>
                <NavItem key={el.value}>
                  <NavLink
                    className={
                      activeTab === el?.value
                        ? "activelink sub-item"
                        : "sub-item"
                    }
                    onClick={() => toggleTab(el?.value)}
                  >
                    {el?.name}
                  </NavLink>
                </NavItem>
            )}
          </Nav>
        </div>
        <div
          style={{
            color: "black",
            minHeight: "auto",
            height: "70vh",
            overflow: "auto",
          }}
        >
          <TabContent activeTab={activeTab}>
            {/* {allTabs?.map((el, index) => {
              console.log("log =====", index)
              return (
                <TabPane key={el.value} tabId={el?.value}>
                  {el?.component ? (
                    <el.component
                      key={el.value}
                      activeCenterContainerTab={activeTab}
                      trainee_id={trainee_id}
                    />
                  ) : (
                    <h1>{el?.name}</h1>
                  )}
                </TabPane>
              );
            })} */}

            {
              activeTab === "myClips" ?
                <TabPane tabId="myClips">
                  {allTabs[0]?.component ? (
                    <Clips
                      accountType={accountType}
                      activeCenterContainerTab={activeTab}
                      trainee_id={trainee_id}
                      isOpen={isOpen}
                    />
                  ) : (
                    <h1>{allTabs[0]?.name}</h1>
                  )}
                </TabPane> :
                activeTab === "gamePlans" ?
                  <TabPane tabId="gamePlans">
                    {allTabs[1]?.component ? (
                      <Reports
                        accountType={accountType}
                        activeCenterContainerTab={activeTab}
                        trainee_id={trainee_id}
                        isOpen={isOpen}
                      />
                    ) : (
                      <h1>{allTabs[1]?.name}</h1>
                    )}
                  </TabPane> :
                  null
            }
          </TabContent>
        </div>
      </div>
    </>
  );
};

export default ClipsAndGamePlan;

