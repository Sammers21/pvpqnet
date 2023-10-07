import Pagination from '@mui/material/Pagination';

interface IProps {
  page: number;
  totalPages: number;
  pagination: boolean;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  recordsLength: number;
}

const TablePagination = ({ page, totalPages, pagination, onPageChange, recordsLength }: IProps) => {
  const visible = pagination && !!recordsLength;

  return visible ? (
    <div className="flex justify-end mb-4 mt-2">
      <Pagination
        count={totalPages}
        page={page}
        onChange={onPageChange}
        hideNextButton
        hidePrevButton
      />
    </div>
  ) : null;
};

export default TablePagination;
