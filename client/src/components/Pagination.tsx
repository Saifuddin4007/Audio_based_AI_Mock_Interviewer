import React from 'react';

interface PaginationProps {
    page: number;
    onPageChange:React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
}

const Pagination = ({page, onPageChange, totalPages}: PaginationProps) => {
  return (
    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
        <button
            disabled= {totalPages === 0 ||  page <= 1}
            onClick={()=> onPageChange((current:number)=> current-1)}
            className="px-4 py-2 border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
            Previous
        </button>
        <span className="font-medium text-gray-900">
            Page {page} of {totalPages}
        </span>
        <button
            disabled= {totalPages === 0 || page >= totalPages}
            onClick={()=> onPageChange((current:number)=> current+1)}
            className="px-4 py-2 border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
            Next
        </button>
    </div>
  )
}

export default Pagination