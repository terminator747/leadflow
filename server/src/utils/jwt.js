const jwt = require("jsonwebtoken");

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      brokerageId: user.brokerageId ? user.brokerageId.toString() : null
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = generateToken;
