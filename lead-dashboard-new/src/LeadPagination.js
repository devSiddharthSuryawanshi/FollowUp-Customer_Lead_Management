import React from 'react';

function LeadPagination({ 
  currentPage, 
  totalPages, 
  totalLeads, 
  leadsPerPage, 
  onPageChange,
  onPerPageChange 
}) {
  const startItem = (currentPage - 1) * leadsPerPage + 1;
  const endItem = Math.min(currentPage * leadsPerPage, totalLeads);

  return (
    <div className="lead-pagination">
      <div className="pagination-info">
        <span>
          Showing {startItem}-{endItem} of {totalLeads} leads
        </span>
        <select 
          value={leadsPerPage} 
          onChange={(e) => onPerPageChange(parseInt(e.target.value))}
          className="per-page-select"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary"
        >
          Previous
        </button>
        
        <div className="page-numbers">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => 
              page === 1 || 
              page === totalPages || 
              Math.abs(page - currentPage) <= 2
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="ellipsis">...</span>
                )}
                <button
                  onClick={() => onPageChange(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))
          }
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default LeadPagination;