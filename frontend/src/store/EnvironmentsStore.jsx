import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { createContext, useState } from "react"

export const EnvironmentStore=createContext({});
export const EnvironmentContextProvider=({children})=>{
    const token=localStorage.getItem("token");
       const decoded = jwtDecode(token);
        const userId = decoded.id;
    const [currEnvironments,setCurrenvironments]=useState([]);
    const getEnvironments=async()=>{
        try{
            const response=await axios.get(`https://water-watch-si4e.vercel.app/api/environment/getEnvironments/${userId}`);
            setCurrenvironments(response.data.environments);
        }catch(err){
            console.log(err);
        }
    }
    return <EnvironmentStore.Provider value={{getEnvironments,currEnvironments}}>
        {children}
    </EnvironmentStore.Provider>
}