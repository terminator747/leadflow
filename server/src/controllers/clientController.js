const Client = require("../models/Client");

async function getClients(req, res) {
  try {
    /*
     * Clients should only receive their own record.
     */
    if (req.user.role === "client") {
      const client = await Client.findOne({
        userId: req.user._id,
        brokerageId: req.user.brokerageId
      }).populate("advisorId", "name email");

      return res.json(
        client ? [client] : []
      );
    }

    const query =
      req.user.role === "platform_admin"
        ? {}
        : {
            brokerageId:
              req.user.brokerageId
          };

    const clients = await Client.find(query)
      .populate("advisorId", "name email")
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    console.error(
      "getClients error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
}

async function getMyClient(req, res) {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({
        message:
          "This endpoint is only available to clients"
      });
    }

    const client = await Client.findOne({
      userId: req.user._id,
      brokerageId: req.user.brokerageId
    }).populate(
      "advisorId",
      "name email"
    );

    if (!client) {
      return res.status(404).json({
        message: "Client profile not found"
      });
    }

    res.json(client);
  } catch (error) {
    console.error(
      "getMyClient error:",
      error
    );

    res.status(500).json({
      message: error.message
    });
  }
}

module.exports = {
  getClients,
  getMyClient
};