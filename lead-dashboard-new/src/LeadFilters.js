import React from 'react';

function LeadFilters({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="lead-filters">
      <h3>Filters</h3>
      <div className="filter-grid">
        <div className="filter-group">
          <label>Score Range</label>
          <select 
            value={filters.scoreRange || ''} 
            onChange={(e) => handleChange('scoreRange', e.target.value)}
          >
            <option value="">All Scores</option>
            <option value="hot">🔥 Hot (70+)</option>
            <option value="warm">🌤️ Warm (40-70)</option>
            <option value="cold">❄️ Cold (&lt;40)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sentiment</label>
          <select 
            value={filters.sentiment || ''} 
            onChange={(e) => handleChange('sentiment', e.target.value)}
          >
            <option value="">All Sentiments</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEGATIVE">Negative</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Intent</label>
          <select 
            value={filters.intent || ''} 
            onChange={(e) => handleChange('intent', e.target.value)}
          >
            <option value="">All Leads</option>
            <option value="yes">✅ Intent Detected</option>
            <option value="no">❌ No Intent</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Industry</label>
          <input
            type="text"
            placeholder="Filter by industry..."
            value={filters.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Location</label>
          <input
            type="text"
            placeholder="Filter by location..."
            value={filters.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>
      </div>
      
      <button onClick={onReset} className="btn-secondary filter-reset">
        Reset Filters
      </button>
    </div>
  );
}

export default LeadFilters;