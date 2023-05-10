import { Grid, Pagination } from '@mui/material';

interface IProps {
  page: number;
  totalPages: number;
  pagination: boolean;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  recordsLength: number;
}

const TablePagination = ({ page, totalPages, pagination, onPageChange, recordsLength }: IProps) => {
  const renderFooter = () => {
    const visible = pagination && !!recordsLength;

    return visible ? (
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px',
          marginTop: '16px',
        }}
      >
        <Pagination
          count={totalPages}
          page={page}
          onChange={onPageChange}
          hideNextButton
          hidePrevButton
        />
      </Grid>
    ) : null;
  };

  return renderFooter();
};

export default TablePagination;
