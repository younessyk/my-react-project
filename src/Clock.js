import React from 'react';


let time = Date().toLocaleString();
class Clock extends Component{
    render(){

        return (


                <p>
                    date {time}
                </p>


        );
}

}

export default Clock;