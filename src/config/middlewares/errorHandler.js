const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    
    res.status(500).json({
        message: "Ocorreu um erro interno no servidor.",
        error: process.env.NODE_ENV === 'production' ? null : err.message 
    });
};

export default errorHandler;