import { React , useState } from "react";

export function NonMemberMessage({ selectedAddress , acceptInvite }) {

  const [details, setDetails] = useState("");
  
  return (
    <>
      <p>You are not a member</p>
      <p>
        You can request to join a club by applying below with the form below:
      </p>
      {/* form to apply to join a club that saves to the state and displays characters remaing*/}
      <form>
        <div className="form-group">
          <label htmlFor="yourAddress">Your Address</label>
          <input type="text" className="form-control" id="yourAddress" value={selectedAddress} readOnly />
        </div>
        {/* user can add details to their application, max text is 1000 characters */}
        <div className="form-group">
          <label htmlFor="details">Details</label>
          <textarea className="form-control" id="details" rows="3" maxLength="1000" value={details} onChange={(e) => setDetails(e.target.value)}></textarea>
          <small id="detailsHelp" className="form-text text-muted">You have {1000 - details.length} characters remaining</small>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>


      <p>You have been invited to join club: <i>insert club address</i></p>
      
      <p>Click the button below to accept the invite:</p>

      <button type="button" className="btn btn-primary" onClick={acceptInvite}>Accept Invite</button>

    </>
  );
}
