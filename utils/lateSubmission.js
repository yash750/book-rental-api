const isLate = async (record) => {
    const isLate = await record.dueAt < new Date();
    return isLate;
  };
  
  //Calculate fine if user isLate in returning the book
  const calculateFine = async (record) => {
    const now = new Date();
    const delayInMs = now - record.dueAt;
  
    if (delayInMs <= 0) return 0; // not late
  
    const delayInDays = Math.ceil(delayInMs / (1000 * 60 * 60 * 24));
    const fine = delayInDays * 10; // ₹10 per day
    return fine;
  };
  
module.exports = { isLate, calculateFine };