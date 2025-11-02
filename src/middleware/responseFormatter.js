const responseFormatter = (req, res, next) => {
    res.success = (message, items, metadata = {}) => {
        res.status(200).json({
            status: "success",
            message: message,
            data: items,
            metadata
        });
    }

    res.error = (message, statusCode, details) => {
        res.status(statusCode).json({
            status: "error",
            error: {
                message,
                statusCode,
                details
            },
        })
    }

    next();
}

module.exports = responseFormatter;