import React, { useState, useEffect } from 'react';
import './App.css';
import LeadFilters from './LeadFilters';
import LeadSearch from './LeadSearch';
import LeadPagination from './LeadPagination';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Pie, Radar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const API_BASE = 'http://localhost:8000';

function App() {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  const [showAll, setShowAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_BASE}/leads`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLeads, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Filter and search logic
  const filteredLeads = leads.filter(lead => {
    const searchMatch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.message.toLowerCase().includes(searchTerm.toLowerCase());

    const scoreMatch = !filters.scoreRange || 
      (filters.scoreRange === 'hot' && lead.score > 70) ||
      (filters.scoreRange === 'warm' && lead.score >= 40 && lead.score <= 70) ||
      (filters.scoreRange === 'cold' && lead.score < 40);

    const sentimentMatch = !filters.sentiment || lead.sentiment_label === filters.sentiment;
    const intentMatch = !filters.intent || 
      (filters.intent === 'yes' && lead.intent_detected) ||
      (filters.intent === 'no' && !lead.intent_detected);
    const industryMatch = !filters.industry || 
      lead.industry.toLowerCase().includes(filters.industry.toLowerCase());
    const locationMatch = !filters.location || 
      lead.location.toLowerCase().includes(filters.location.toLowerCase());

    return searchMatch && scoreMatch && sentimentMatch && intentMatch && 
           industryMatch && locationMatch;
  });

  // Get display leads based on view mode
  const getDisplayLeads = () => {
    if (!showAll && !searchTerm && Object.keys(filters).length === 0) {
      return filteredLeads.slice(0, 4);
    }
    return filteredLeads;
  };

  const displayLeads = getDisplayLeads();
  const totalPages = Math.ceil(displayLeads.length / leadsPerPage);
  const paginatedLeads = showAll ? 
    displayLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage) : 
    displayLeads;

  const handleFilterReset = () => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const toggleView = () => {
    setShowAll(!showAll);
    setCurrentPage(1);
    if (!showAll) {
      setFilters({});
      setSearchTerm('');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lead Management Dashboard</h1>
        <div className="header-actions">
          <div className="auto-refresh-section">
            <label className="auto-refresh-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <span className="last-refresh">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
          <button 
            onClick={fetchLeads}
            className="btn-secondary"
          >
            Refresh Now
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="dashboard-top">
          <LeadCalendar leads={leads} />
          <LeadSummaryCharts leads={leads} />
        </div>
        
        <div className="leads-section">
          {showAll && (
            <>
              <LeadSearch 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
              
              <LeadFilters 
                filters={filters}
                onFilterChange={setFilters}
                onReset={handleFilterReset}
              />
            </>
          )}
          
          <div className="leads-header">
            <h2>
              {showAll ? `All Leads (${displayLeads.length})` : 'Latest Leads'}
            </h2>
            <button 
              onClick={toggleView}
              className="btn-primary view-toggle"
            >
              {showAll ? 'Show Latest 4' : `View All ${leads.length} Leads`}
            </button>
          </div>
          
          <LeadList leads={paginatedLeads} showAll={showAll} />
          
          {showAll && displayLeads.length > leadsPerPage && (
            <LeadPagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalLeads={displayLeads.length}
              leadsPerPage={leadsPerPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(newPerPage) => {
                setLeadsPerPage(newPerPage);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function LeadCalendar({ leads }) {
  // Always start with today's date
  const today = new Date();
  const [value, setValue] = useState(today);
  const [activeStartDate, setActiveStartDate] = useState(today);

  // Count leads per day - distribute existing leads across the last few days
  const getLeadsPerDay = () => {
    const leadsPerDay = {};
    
    // If leads don't have created_at, distribute them across recent days
    const maxDaysBack = 7; // Show leads across last 7 days
    
    leads.forEach((lead, index) => {
      let dateStr;
      
      if (lead.created_at && lead.created_at !== null && lead.created_at !== undefined) {
        const createdDate = new Date(lead.created_at);
        dateStr = createdDate.toDateString();
      } else {
        // Distribute leads across recent days
        const daysBack = index % maxDaysBack;
        const leadDate = new Date();
        leadDate.setDate(leadDate.getDate() - daysBack);
        dateStr = leadDate.toDateString();
        
        // Also set a fake created_at for consistency
        lead.created_at = leadDate.toISOString();
      }
      
      leadsPerDay[dateStr] = (leadsPerDay[dateStr] || 0) + 1;
    });
    
    return leadsPerDay;
  };

  const leadsPerDay = getLeadsPerDay();

  
  const getLeadsForDate = (date) => {
    const dateStr = date.toDateString();
    return leads.filter(lead => {
      if (lead.created_at) {
        const leadDate = new Date(lead.created_at);
        return leadDate.toDateString() === dateStr;
      }
      return false;
    });
  };

  const selectedDateLeads = getLeadsForDate(value);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      const count = leadsPerDay[dateStr];
      
      if (count) {
        return (
          <div className="calendar-tile-content">
            <span className="lead-count">{count}</span>
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      const count = leadsPerDay[dateStr];
      
      if (count) {
        if (count >= 5) return 'high-activity';
        if (count >= 3) return 'medium-activity';
        return 'low-activity';
      }
    }
    return null;
  };

  return (
    <div className="lead-calendar">
      <h2>Lead Activity Calendar</h2>
      <div className="calendar-container">
        <div className="calendar-wrapper">
          <Calendar
            onChange={setValue}
            value={value}
            tileContent={tileContent}
            tileClassName={tileClassName}
            onActiveStartDateChange={({ activeStartDate }) => 
              setActiveStartDate(activeStartDate)
            }
            maxDate={new Date()} // Prevent selecting future dates
            view="month"
            defaultActiveStartDate={today}
          />
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot high-activity"></span>
              <span>5+ leads</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot medium-activity"></span>
              <span>3-4 leads</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot low-activity"></span>
              <span>1-2 leads</span>
            </div>
          </div>
        </div>
        
        <div className="selected-date-info">
          <h3>
            {value.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <p className="lead-count-text">
            {selectedDateLeads.length} lead{selectedDateLeads.length !== 1 ? 's' : ''} added
          </p>
          
          {selectedDateLeads.length > 0 && (
            <div className="date-leads-list">
              <h4>Leads for this date:</h4>
              <ul>
                {selectedDateLeads.map((lead, index) => (
                  <li key={lead.id || index} className="date-lead-item">
                    <span className="lead-name">{lead.name}</span>
                    <span className={`score-indicator ${
                      lead.score > 70 ? 'hot' : 
                      lead.score > 40 ? 'warm' : 'cold'
                    }`}>
                      {lead.score_label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadSummaryCharts({ leads }) {
  const scoreData = leads.reduce((acc, lead) => {
    if (lead.score > 70) acc.hot++;
    else if (lead.score > 40) acc.warm++;
    else acc.cold++;
    return acc;
  }, { hot: 0, warm: 0, cold: 0 });

  const scoreChartData = {
    labels: ['🔥 Hot', '🌤️ Warm', '❄️ Cold'],
    datasets: [{
      data: [scoreData.hot, scoreData.warm, scoreData.cold],
      backgroundColor: ['#e74c3c', '#f39c12', '#3498db'],
      hoverBackgroundColor: ['#c0392b', '#e67e22', '#2980b9']
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="summary-charts">
      <h2>Lead Summary</h2>
      <div className="charts-grid-single">
        <div className="chart-container">
          <h3>Lead Score Distribution</h3>
          <div className="chart-wrapper">
            <Pie data={scoreChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadList({ leads, showAll }) {
  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <h3>No leads yet</h3>
        <p>Leads will appear here once added via API</p>
      </div>
    );
  }

  return (
    <div className="lead-list">
      <div className="lead-grid">
        {leads.map((lead) => (
          <LeadCard key={lead.id || `${lead.name}-${Math.random()}`} lead={lead} />
        ))}
      </div>
      {!showAll && leads.length === 4 && (
        <div className="more-leads-hint">
          <p>Showing latest 4 leads</p>
        </div>
      )}
    </div>
  );
}

function LeadRadarChart({ lead }) {
  // Normalize data for radar chart (0-100 scale)
  const normalizeValue = (value, max) => {
    return Math.min((value / max) * 100, 100);
  };

  // Define max values for normalization
  const maxValues = {
    website_visits: 20,
    email_opens: 10,
    time_spent_on_site: 30,
    click_through_rate: 1,
    past_purchases: 10,
    inquiry_responses: 5
  };

  const radarData = {
    labels: [
      'Website Visits',
      'Email Opens',
      'Time on Site',
      'Click Rate (%)',
      'Past Purchases',
      'Inquiry Responses'
    ],
    datasets: [
      {
        label: 'Lead Metrics',
        data: [
          normalizeValue(lead.website_visits || 0, maxValues.website_visits),
          normalizeValue(lead.email_opens || 0, maxValues.email_opens),
          normalizeValue(lead.time_spent_on_site || 0, maxValues.time_spent_on_site),
          (lead.click_through_rate || 0) * 100,
          normalizeValue(lead.past_purchases || 0, maxValues.past_purchases),
          normalizeValue(lead.inquiry_responses || 0, maxValues.inquiry_responses)
        ],
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          display: false,
          stepSize: 20
        },
        pointLabels: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#495057'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const labels = [
              `Website Visits: ${lead.website_visits || 0}`,
              `Email Opens: ${lead.email_opens || 0}`,
              `Time on Site: ${lead.time_spent_on_site || 0} min`,
              `Click Rate: ${((lead.click_through_rate || 0) * 100).toFixed(1)}%`,
              `Past Purchases: ${lead.past_purchases || 0}`,
              `Inquiry Responses: ${lead.inquiry_responses || 0}`
            ];
            return labels[context.dataIndex];
          }
        }
      }
    }
  };

  return (
    <div className="lead-radar-chart">
      <h4>Lead Engagement Metrics</h4>
      <div className="radar-wrapper">
        <Radar data={radarData} options={radarOptions} />
      </div>
    </div>
  );
}

function LeadCard({ lead }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreClass = (score) => {
    if (score > 70) return 'hot';
    if (score > 40) return 'warm';
    return 'cold';
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`lead-card ${isExpanded ? 'expanded' : 'collapsed'}`} onClick={toggleExpanded}>
      <div className="lead-header">
        <h3>{lead.name}</h3>
        <span className={`score-badge ${getScoreClass(lead.score)}`}>
          {lead.score_label}
        </span>
      </div>
      
      {isExpanded && (
        <div className="lead-details">
          <div className="lead-info-grid">
            <div className="lead-basic-info">
              <p><strong>Industry:</strong> {lead.industry}</p>
              <p><strong>Location:</strong> {lead.location}</p>
              <p><strong>Role:</strong> {lead.job_role}</p>
              <p><strong>Company Size:</strong> {lead.company_size}</p>
              <p><strong>Lead Source:</strong> {lead.lead_source}</p>
              <p><strong>Score:</strong> {lead.score.toFixed(2)}</p>
              
              <div className="lead-metrics">
                <span className={`sentiment-badge ${lead.sentiment_label?.toLowerCase()}`}>
                  {lead.sentiment_label}
                </span>
                <span className="intent-badge">
                  {lead.intent_label}
                </span>
              </div>
            </div>
            
            <div className="lead-chart-section">
              <LeadRadarChart lead={lead} />
            </div>
          </div>
          
          <div className="message-preview">
            <strong>Message:</strong>
            <p>{lead.message}</p>
          </div>
          
          {lead.followup && (
            <div className="followup-preview">
              <strong>AI Follow-up:</strong>
              <p>{lead.followup}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="expand-indicator">
        {isExpanded ? '▼' : '▶'}
      </div>
    </div>
  );
}

export default App;