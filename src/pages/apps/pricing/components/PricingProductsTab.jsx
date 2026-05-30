import AdminDataGrid from 'src/components/admin/AdminDataGrid'
import AdminGridContainer from 'src/components/admin/AdminGridContainer'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { PRODUCT_LABELS, centsToInput, inputToCents } from 'src/constants/pricingAdmin'

export default function PricingProductsTab({ productFees, onPatchProductFee, canEdit = true }) {
  const rows = Object.entries(productFees || {}).map(([key, fees]) => ({
    id: key,
    product: PRODUCT_LABELS[key] || key.replace(/_/g, ' '),
    traineePlatformFeeMinor: fees.traineePlatformFeeMinor ?? 0,
    trainerPlatformFeeMinor: fees.trainerPlatformFeeMinor ?? 0,
    traineeDisplay: centsToInput(fees.traineePlatformFeeMinor),
    trainerDisplay: centsToInput(fees.trainerPlatformFeeMinor)
  }))

  const cols = [
    { field: 'product', headerName: 'Product', flex: 1, minWidth: 200 },
    {
      field: 'traineeDisplay',
      headerName: 'Trainee fee ($)',
      width: 140,
      editable: true
    },
    {
      field: 'trainerDisplay',
      headerName: 'Coach fee ($)',
      width: 140,
      editable: true
    }
  ]

  return (
    <AdminPageSection title='Per-product platform fees'>
      <AdminGridContainer>
        <AdminDataGrid
          autoHeight
          rows={rows}
          columns={cols}
          hideFooter
          isCellEditable={() => canEdit}
          processRowUpdate={newRow => {
            onPatchProductFee(newRow.id, {
              traineePlatformFeeMinor: inputToCents(newRow.traineeDisplay),
              trainerPlatformFeeMinor: inputToCents(newRow.trainerDisplay)
            })
            return {
              ...newRow,
              traineeDisplay: newRow.traineeDisplay,
              trainerDisplay: newRow.trainerDisplay
            }
          }}
          onProcessRowUpdateError={() => {}}
        />
      </AdminGridContainer>
    </AdminPageSection>
  )
}
