import rateLimit from "express-rate-limit";

const updateUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, //15 min.
  max: 3, //limit each IP to 5 request
  message: "Too many API requests from this IP, please try again after 60 min.",
});

export { updateUserLimiter };
