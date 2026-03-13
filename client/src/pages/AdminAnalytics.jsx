import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, CheckCircle, XCircle, Clock, Wallet, Percent, Award, DollarSign, Activity } from 'lucide-react';
import API from '../api';

// Professional dashboard colors
const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Approved (Green), Rejected (Red), Pending (Orange)
const CHART_COLORS = {
  navy: '#2a3166',
  navyLight: '#434c8c',
  coral: '#ee7879',
  pink: '#f4abaa',
  mint: '#cae7df'
};

// Premium Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip glass-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => {
          // Safety check to prevent toLocaleString crashes
          const val = entry.value || 0;
          return (
            <div key={index} className="tooltip-row">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }}></span>
              <p className="tooltip-value" style={{ color: entry.color || entry.fill }}>
                {entry.name}: <span className="value-bold">{
                  entry.name?.includes('Amount') || entry.name?.includes('Grant')
                    ? `₹${Number(val).toLocaleString('en-IN')}`
                    : val
                }</span>
              </p>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

function AdminAnalytics() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    totalConcessionAmount: 0
  });
  const [departments, setDepartments] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [feeTrend, setFeeTrend] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [fetchError, setFetchError] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const results = await Promise.allSettled([
        API.get('/analytics/summary'),
        API.get('/analytics/departments'),
        API.get('/analytics/monthly-trend'),
        API.get('/analytics/daily-activity'),
        API.get('/analytics/fee-trend'),
        API.get('/schemes')
      ]);

      const [summaryRes, deptRes, trendRes, dailyRes, feeRes, schemesRes] = results;

      if (summaryRes.status === 'fulfilled') setStats(summaryRes.value.data || { total: 0, approved: 0, rejected: 0, pending: 0, totalConcessionAmount: 0 });
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data || []);
      if (trendRes.status === 'fulfilled') setMonthlyTrend(trendRes.value.data || []);
      if (dailyRes.status === 'fulfilled') setDailyActivity(dailyRes.value.data || []);
      if (feeRes.status === 'fulfilled') setFeeTrend(feeRes.value.data || []);
      if (schemesRes.status === 'fulfilled') setSchemes(schemesRes.value.data || []);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some analytics endpoints failed:', failed);
        setFetchError(`Warning: Failed to load ${failed.length} analytics modules.`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setFetchError('Failed to connect to analytics service.');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const { data } = await API.post('/change-password', {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [navigate]);

  if (loading) {
    return (
      <div className="analytics-container loading-state">
        <div className="spinner"></div>
        <div className="loading-text">Assembling Intelligence Dashboard...</div>
      </div>
    );
  }

  // Insights calculation
  const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0;
  const avgConcession = stats.approved > 0 ? (stats.totalConcessionAmount / stats.approved).toFixed(0) : 0;
  const mostAppliedScheme = schemes && schemes.length > 0
    ? schemes.reduce((prev, curr) => (prev.studentsApplied > curr.studentsApplied) ? prev : curr).name
    : 'N/A';

  // Chart Data Preparation
  const statusPieData = [
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Pending', value: stats.pending }
  ];

  const deptChartData = [...departments]
    .sort((a, b) => b.count - a.count)
    .map(d => ({
      name: d._id || 'Unknown',
      total: d.count,
      approved: d.approvedCount,
      pending: d.pendingCount,
      rejected: d.rejectedCount
    }));

  const maxDeptCount = deptChartData.length > 0 ? deptChartData[0].total : 1;

  return (
    <div className="admin-page-bg" style={{ minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1600px', margin: '0 auto' }}>

        {/* Sub-Navigation Bar */}
        <nav className="admin-nav-modern">
          {/* Left: Branding */}
          <div className="admin-nav-item active" style={{ fontSize: '1.4rem', fontWeight: '800', cursor: 'pointer' }} onClick={() => navigate('/admin')}>
            FEE CONCESSION
          </div>

          {/* Center: Navigation Links */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '40px' }}>
            <div className="admin-nav-item" onClick={() => navigate('/admin')}>Dashboard</div>
            <div className="admin-nav-item" style={{ borderBottom: '2px solid #ee7879' }}>Analytics</div>
          </div>

          {/* Right: Settings */}
          <button className="btn-settings-navy" onClick={() => setShowSettingsModal(true)}>
            ⚙️ Settings
          </button>
        </nav>

        <div className="analytics-header-section" style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div className="title-area">
            <h1>Executive Analytics Overview</h1>
            <p>Comprehensive data mapping, application lifecycle metrics, and grant projections.</p>
          </div>
          <div className="header-actions">
            <button className="primary refresh-btn enhanced-btn" onClick={fetchAnalytics}>Refresh Data</button>
          </div>
        </div>

        {fetchError && (
          <div className="error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '16px 24px', borderRadius: '16px', marginBottom: '30px', fontWeight: '700', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.1)' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span> {fetchError}
          </div>
        )}

        {/* Settings Modal (Unchanged functionality) */}
        {showSettingsModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button onClick={() => setShowSettingsModal(false)} className="close-modal">✕</button>
              <h2>Security Settings</h2>
              <div className="settings-form-wrapper">
                <form onSubmit={handleChangePassword}>
                  {passwordError && <div className="error-message p-3 mb-4 bg-red-100 text-red-700 rounded-lg">{passwordError}</div>}
                  {passwordSuccess && <div className="success-message p-3 mb-4 bg-green-100 text-green-700 rounded-lg">{passwordSuccess}</div>}
                  <div className="form-group">
                    <label>CURRENT PASSWORD</label>
                    <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>NEW PASSWORD</label>
                    <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>CONFIRM NEW PASSWORD</label>
                    <input type="password" value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })} required />
                  </div>
                  <button type="submit" className="save-btn enhanced-btn">UPDATE CREDENTIALS</button>
                </form>
              </div>
            </div>
          </div>
        )}


        {/* Middle Insight Cards Row */}
        <div className="insights-ribbon">
          <div className="insight-pill stat-box">
            <Wallet className="pill-icon" />
            <div className="pill-text"><strong>₹{Number(stats?.totalConcessionAmount || 0).toLocaleString('en-IN')}</strong> Concessions</div>
          </div>
          <div className="insight-pill stat-box">
            <Percent className="pill-icon" />
            <div className="pill-text"><strong>{approvalRate || 0}%</strong> Approval Rate</div>
          </div>
          <div className="insight-pill stat-box">
            <Award className="pill-icon" />
            <div className="pill-text"><strong>{mostAppliedScheme || 'N/A'}</strong> Popular Scheme</div>
          </div>
          <div className="insight-pill stat-box">
            <DollarSign className="pill-icon" />
            <div className="pill-text"><strong>₹{Number(avgConcession || 0).toLocaleString('en-IN')}</strong> Avg Reward</div>
          </div>
        </div>

        {/* Main Charts Layout */}
        <div className="analytics-layout-grid">

          {/* SVG DEFS for Glows and Gradients */}
          <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="navyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.navyLight} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_COLORS.navy} stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.mint} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.mint} stopOpacity={0.05} />
              </linearGradient>
              <filter id="glowDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#ee7879" floodOpacity="0.4" />
              </filter>
              <filter id="areaDropShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2a3166" floodOpacity="0.25" />
              </filter>
              <filter id="barDropShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#434c8c" floodOpacity="0.3" />
              </filter>
            </defs>
          </svg>

          {/* Monthly Trend - LARGE THICK BARS */}
          <div className="card-glass chart-large">
            <div className="card-top">
              <div>
                <h3>Monthly Intake Trend</h3>
                <p className="subtitle">Application volume over the year</p>
              </div>
              <span className="chart-badge primary-badge">Volume</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={monthlyTrend} margin={{ top: 30, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 600 }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(42, 49, 102, 0.04)' }} />
                  {/* Thick bars with Drop Shadow SVG filter */}
                  <Bar dataKey="count" name="Applications" fill="url(#navyGradient)" radius={[10, 10, 0, 0]} maxBarSize={70} animationDuration={1500} style={{ filter: 'url(#barDropShadow)' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution - THICK DONUT CHART */}
          <div className="card-glass chart-tall">
            <div className="card-top">
              <div>
                <h3>Decision Distribution</h3>
                <p className="subtitle">Overall application lifecycle</p>
              </div>
              <span className="chart-badge">Lifecycle</span>
            </div>
            <div className="chart-wrapper flex-center">
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%" cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={6}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1500}
                    stroke="none"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="pie-cell-hover" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution - STACKED BAR CHART */}
          <div className="card-glass chart-large glow-hover">
            <div className="card-top">
              <div>
                <h3>Department Outcomes</h3>
                <p className="subtitle">Approved vs Pending vs Rejected per sector</p>
              </div>
              <span className="chart-badge academic-badge">Academic</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart layout="vertical" data={deptChartData.slice(0, 8)} margin={{ top: 20, left: 60, right: 30, bottom: 10 }} barSize={26}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 13, fontWeight: 700, fill: '#2a3166' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  {/* Stacked Bars Component */}
                  <Bar dataKey="approved" name="Approved" stackId="a" fill={PIE_COLORS[0]} animationDuration={1500} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill={PIE_COLORS[2]} animationDuration={1500} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected" stackId="a" fill={PIE_COLORS[1]} animationDuration={1500} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Collection Trend - ENHANCED AREA CHART */}
          <div className="card-glass">
            <div className="card-top">
              <div>
                <h3>Grant Value Projection</h3>
                <p className="subtitle">Total fees waived (₹)</p>
              </div>
              <span className="chart-badge finance-badge">Finance</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={feeTrend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" name="Amount" stroke={CHART_COLORS.navy} strokeWidth={4} fillOpacity={1} fill="url(#areaColor)" animationDuration={1800} style={{ filter: 'url(#areaDropShadow)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Activity - GLOWING LINE CHART */}
          <div className="card-glass">
            <div className="card-top">
              <div>
                <h3>Daily Activity (30d)</h3>
                <p className="subtitle">Day-by-day application volume</p>
              </div>
              <span className="chart-badge live-badge">Live</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyActivity} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} dy={10} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Activity" stroke={CHART_COLORS.coral} strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff', stroke: CHART_COLORS.coral }} activeDot={{ r: 8, strokeWidth: 0, fill: CHART_COLORS.coral }} animationDuration={2000} style={{ filter: 'url(#glowDropShadow)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Departments Ranked List (Refined UI) */}
          <div className="card-glass chart-tall gradient-edge">
            <div className="card-top">
              <div>
                <h3>Institutional Ranks</h3>
                <p className="subtitle">Applications per sector</p>
              </div>
            </div>
            <div className="ranked-entities-list">
              {deptChartData.slice(0, 5).map((dept, index) => (
                <div key={dept.name} className="rank-row">
                  <div className="rank-meta">
                    <span className={`rank-number r-${index + 1}`}>{index + 1}</span>
                    <span className="entity-name">{dept.name}</span>
                  </div>
                  <div className="rank-values">
                    <span className="v-total">{dept.total} apps</span>
                    <div className="rank-progress-rail">
                      <div className="rank-progress-fill" style={{ width: `${(dept.total / maxDeptCount) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <style>{`
          /* CSS Reset & Advanced Globals */
          .title-area h1, .title-area h3, .title-area h2 {
            color: #2a3166;
          }

          /* Floating Navigation */
          .floating-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 20px;
            margin-top: 15px;
            padding: 14px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 40px rgba(42, 49, 102, 0.06);
            z-index: 1000;
          }

          .nav-links-center {
            display: flex;
            gap: 40px;
            font-weight: 700;
            color: #2a3166;
          }

          .settings-trigger {
            background: #2a3166;
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(42, 49, 102, 0.3);
          }
          .settings-trigger:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(42, 49, 102, 0.4);
          }

          .title-area h1 {
            font-size: 2.2rem;
            font-weight: 900;
            margin: 0 0 8px 0;
            color: #1e293b;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 0;
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 500;
          }

          .enhanced-btn {
            background: linear-gradient(135deg, #2a3166 0%, #434c8c 100%);
            color: white;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 700;
            border: none;
            box-shadow: 0 8px 15px rgba(42, 49, 102, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
          }
          .enhanced-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 20px rgba(42, 49, 102, 0.3);
          }

          /* KPI Dashboard Grid */
          .kpi-dashboard-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 24px;
          }

          .premium-kpi {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 26px;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(42, 49, 102, 0.04), inset 0 0 0 1px rgba(255,255,255,0.8);
            display: flex;
            align-items: center;
            gap: 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .premium-kpi:hover { 
            transform: translateY(-6px); 
            box-shadow: 0 20px 40px rgba(42, 49, 102, 0.08), inset 0 0 0 1px rgba(255,255,255,0.8);
          }

          .kpi-icon {
            width: 60px;
            height: 60px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.6);
          }

          .premium-kpi.total .kpi-icon { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #4338ca; }
          .premium-kpi.approved .kpi-icon { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #059669; }
          .premium-kpi.pending .kpi-icon { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; }
          .premium-kpi.rejected .kpi-icon { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #dc2626; }

          .kpi-content .label { font-size: 0.9rem; color: #64748b; font-weight: 700; margin-bottom: 4px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
          .kpi-content .value { font-size: 2.2rem; font-weight: 900; margin: 0; color: #0f172a; line-height: 1; }

          /* Insights Ribbon */
          .insights-ribbon {
            display: flex;
            gap: 16px;
            margin-bottom: 40px;
            overflow-x: auto;
            padding-bottom: 10px;
            -webkit-overflow-scrolling: touch;
          }
          .insights-ribbon::-webkit-scrollbar { height: 6px; }
          .insights-ribbon::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }

          .insight-pill {
            display: flex;
            align-items: center;
            gap: 12px;
            white-space: nowrap;
          }

          .pill-icon { color: #ee7879; }
          .pill-text { font-size: 0.95rem; font-weight: 500; color: #334155; }
          .pill-text strong { color: #0f172a; font-weight: 800; font-size: 1.1rem; }

          /* Layout Grid */
          .analytics-layout-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 30px;
          }

          .card-glass {
            background: linear-gradient(145deg, #cae7df, #f4abaa);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            flex-direction: column;
            grid-column: span 6;
            transition: all 0.3s ease;
          }
          .card-glass:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          .chart-large { grid-column: span 8; }
          .chart-tall { grid-column: span 4; }

          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }

          .card-top h3 { font-size: 1.35rem; font-weight: 800; margin: 0 0 4px 0; color: #1e293b; letter-spacing: -0.3px; }
          .subtitle { font-size: 0.9rem; color: #64748b; margin: 0; font-weight: 500; }
          
          .chart-badge { font-size: 0.75rem; font-weight: 800; padding: 6px 14px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .primary-badge { background: #e0e7ff; color: #4338ca; }
          .academic-badge { background: #fce7f3; color: #be185d; }
          .finance-badge { background: #dcfce7; color: #15803d; }
          .live-badge { background: #ffedd5; color: #c2410c; }

          /* Premium Glassmorphic Tooltip */
          .glass-tooltip {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            padding: 16px 20px;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5);
            min-width: 180px;
          }
          .tooltip-label { font-weight: 800; color: #1e293b; margin-bottom: 12px; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .tooltip-row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
          .tooltip-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
          .tooltip-value { font-size: 0.95rem; font-weight: 600; margin: 0; }
          .value-bold { font-weight: 900; }

          /* Customizing Recharts SVG elements */
          .pie-cell-hover {
            transition: all 0.3s ease;
            outline: none;
          }
          .pie-cell-hover:hover {
            opacity: 0.85;
            filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.15));
            cursor: pointer;
          }

          /* Ranked Entities List */
          .ranked-entities-list { display: flex; flex-direction: column; gap: 24px; padding-top: 10px; }
          .rank-row { display: flex; flex-direction: column; gap: 10px; }
          .rank-meta { display: flex; align-items: center; gap: 14px; }
          .rank-number { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .rank-number.r-1 { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
          .rank-number.r-2 { background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%); color: white; }
          .rank-number.r-3 { background: linear-gradient(135deg, #b45309 0%, #92400e 100%); color: white; }
          .rank-number.r-4, .rank-number.r-5 { background: #f1f5f9; color: #475569; box-shadow: none; font-weight: 800; }
          
          .entity-name { font-weight: 800; font-size: 1.05rem; color: #1e293b; }
          .rank-values { display: flex; align-items: center; gap: 18px; }
          .v-total { font-size: 0.85rem; font-weight: 800; color: #64748b; white-space: nowrap; width: 60px; text-align: right; }
          .rank-progress-rail { flex-grow: 1; height: 12px; background: #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); }
          .rank-progress-fill { height: 100%; background: linear-gradient(90deg, #434c8c 0%, #2a3166 100%); border-radius: 12px; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); }

          /* Modal styling */
          .modal-overlay { z-index: 9999; }
          .modal-content { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid rgba(255,255,255,0.4); }
          .close-modal { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; transition: all 0.2s; }
          .close-modal:hover { background: #e2e8f0; transform: rotate(90deg); }

          .loading-state {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 24px;
            background: #f8fafc;
          }
          .spinner { width: 60px; height: 60px; border: 6px solid #e2e8f0; border-top: 6px solid #2a3166; border-radius: 50%; animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .loading-text { font-weight: 800; font-size: 1.3rem; color: #1e293b; letter-spacing: -0.5px; }

          /* Responsiveness */
          @media (max-width: 1400px) {
            .analytics-layout-grid { grid-template-columns: repeat(2, 1fr); }
            .card-glass { grid-column: span 1; }
            .chart-large { grid-column: span 2; }
            .chart-tall { grid-column: span 1; }
          }
          @media (max-width: 1024px) {
            .kpi-dashboard-grid { grid-template-columns: repeat(2, 1fr); }
            .analytics-layout-grid { grid-template-columns: 1fr; }
            .card-glass, .chart-large, .chart-tall { grid-column: span 1; }
          }
          @media (max-width: 768px) {
            .kpi-dashboard-grid { grid-template-columns: 1fr; }
            .floating-nav { flex-direction: column; gap: 15px; border-radius: 30px; }
            .nav-links-center { gap: 20px; flex-wrap: wrap; justify-content: center; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default AdminAnalytics;
