// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import AnalyticsSessions from 'src/views/dashboards/analytics/AnalyticsSessions'
import AnalyticsOverview from 'src/views/dashboards/analytics/AnalyticsOverview'
import AnalyticsTotalRevenue from 'src/views/dashboards/analytics/AnalyticsTotalRevenue'

import { useEffect, useState } from 'react'
import authConfig from 'src/configs/auth'
import Modal from '../components/modal/Modal'
import CommissionForm from 'src/layouts/components/student/CommissionForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ActiveUsersTable from '../components/tables/UsersTable'

const Home = () => {

  const [comission, setComission] = useState([]);
  const [commissionModal, setComissionModal] = useState(false);

  useEffect(() => {
    getGlobalCommission()
  }, [])

  const getGlobalCommissionApi = async () => {
    const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
    if (storedToken) {
      return await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/admin/get-global-commission', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      }).then(data => {
        return data.json();
      })
        .then(async response => {
          return response?.result
        })
    }
  }

  async function getGlobalCommission() {
    const res = await getGlobalCommissionApi()
    if (res?.length) {
      setComission(res[0])
      if (commissionModal) {
        closeComissionModal()
      }
    }
  }

  function openComissionModal() {
    setComissionModal(true)
  }

  function closeComissionModal() {
    setComissionModal(false)
  }

  return (
    <>
      <ApexChartWrapper>


        <Grid container spacing={6} className='match-height'>

          <Grid item xs={12}>
            <Card>
              <Grid container alignItems="center">
                <Grid item xs={10}>
                  <CardHeader title='Netqwix Global Commission 🚀' />
                  <CardContent>
                    <Typography sx={{ mb: 2 }}>The commission will apply from all trainers.</Typography>
                  </CardContent>
                </Grid>
                <Grid item xs={2} container >
                  <Typography variant="body1">{comission?.commission ?? 0}%</Typography>
                  {/* <IconButton aria-label="edit commission">
                    <EditIcon />
                  </IconButton> */}
                  <CustomAvatar skin='light' variant='rounded' color="success" onClick={openComissionModal}>
                    <Icon icon='tabler:edit' />
                  </CustomAvatar>

                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={8} container spacing={6}>
            <Grid item xs={6}>
              <AnalyticsTotalRevenue />
            </Grid>
            {/* <Grid item xs={3}>
              <CardStatisticsVertical
                stats='$13.4k'
                color='success'
                trendNumber='+38%'
                title={`Global Commission: ${comission?.commission ?? 0}%`}
                chipText='Last Six Month'
                icon={<Icon icon='tabler:edit' />}
                isCommission={true}
                onClick={openComissionModal}
              />
            </Grid> */}
            <Grid item xs={3}>
              <CardStatisticsVertical
                color='info'
                stats='142.8k'
                trendNumber='+62%'
                chipText='Last One Year'
                title='Total Impressions'
                icon={<Icon icon='mdi:link' />}
              />
            </Grid>
            <Grid item xs={3}>
              <AnalyticsOverview />
            </Grid>
          </Grid>
          <Grid item xs={6} md={2}>
            <CardStatisticsVertical
              stats='155k'
              color='primary'
              trendNumber='+22%'
              title='Total Orders'
              chipText='Last 4 Month'
              icon={<Icon icon='mdi:cart-plus' />}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <AnalyticsSessions />
          </Grid>
        </Grid>
      </ApexChartWrapper>


      <ActiveUsersTable />
      {/* -----------------Modal Commission Edit--------------- */}

      <Modal handleClose={closeComissionModal} open={commissionModal} maxWidth="xs">
        <CommissionForm getGlobalCommission={getGlobalCommission} />
      </Modal>
    </>
  )
}

export default Home
