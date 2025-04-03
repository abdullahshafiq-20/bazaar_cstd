/**
 * Middleware for filtering by date range
 * Extracts startDate and endDate from query parameters and validates them
 */
const dateRangeFilter = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  // If no dates provided, continue without filtering
  if (!startDate && !endDate) {
    return next();
  }
  
  // Validate dates if provided
  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  
  if (startDate && isNaN(startDateObj.getTime())) {
    return res.status(400).json({ error: "Invalid startDate format. Use YYYY-MM-DD." });
  }
  
  if (endDate && isNaN(endDateObj.getTime())) {
    return res.status(400).json({ error: "Invalid endDate format. Use YYYY-MM-DD." });
  }
  
  if (startDateObj && endDateObj && startDateObj > endDateObj) {
    return res.status(400).json({ error: "startDate cannot be later than endDate." });
  }
  
  // Add validated dates to request object for use in route handlers
  req.dateFilter = {
    startDate: startDateObj,
    endDate: endDateObj || new Date() // Default to current date if not provided
  };
  
  next();
};

export default dateRangeFilter;