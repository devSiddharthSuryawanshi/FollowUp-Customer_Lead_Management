import React from 'react';

function LeadSearch({ searchTerm, onSearchChange }) {
  return (
    <div className="lead-search">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search leads by name, company, or message..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>
    </div>
  );
}

export default LeadSearch;