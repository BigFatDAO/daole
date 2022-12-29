import React from "react";

export function Transaction(props) {
    return (
    <div>
        <h4>{props.transactionName}</h4>
        <form
            onSubmit={(event) => {
                // Call any transaction function here
                event.preventDefault();

                const formData = new FormData(event.target);
                const inputs = [];
                
                for (let i = 0 ; i < props.inputArray.length ; i++) {
                    const input = formData.get(props.inputArray[i].label);
                    inputs.push(input);
                }
                if(inputs.length === props.inputArray.length) {
                    props.transaction(...inputs);
                }
            }}
        >
            {props.inputArray.map((input) => {
                return (
                    <div className="form-group">
                        <label>{input.label}</label>
                        <input
                            className="form-control"
                            type={input.type}
                            name={input.label}
                            placeholder={input.label}
                            required
                        />
                        </div>
                )
            })}
            <div className="form-group">
                <input className="btn btn-primary" type="submit" value={props.transactionName} />
            </div>
        </form>
    </div>
    );
}