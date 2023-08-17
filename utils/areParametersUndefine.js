function areParametersUndefine(parameters){
    let error = {
        error: "Missing arguments error",
        missinArguments: [],
    };

    for( let i=0; i< parameters.length; i++){
        if(parameters[i].value === undefined){
            error.missinArguments.push(parameters[i].name)
        }
    }
    if(error.missinArguments.length > 0){
        throw error;
    }
}

module.exports = areParametersUndefine