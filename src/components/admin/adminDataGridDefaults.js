/** Shared DataGrid page sizes for admin tables */
export const ADMIN_GRID_PAGE_SIZES = [25, 50, 100]

export const adminGridInitialPagination = (pageSize = 25) => ({
  pagination: { paginationModel: { pageSize } }
})
