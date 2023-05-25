import React, {useEffect, useState} from 'react';
import PageHeader from "../AppBar";
import Footer from "../Footer";
import {useParams} from "react-router-dom";
import axios from "axios";
import {baseUrl} from "../../config";
import {Box} from "@mui/material";
import {containerBg} from "../../theme";

const Profile = () => {
  let {region, realm, name} = useParams();
  let [data, setData] = useState({});
  const [width, setWidth] = useState(window.innerWidth);
  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  const loadProfile = async () => {
    const data = (await axios.get(baseUrl + `/api/${region}/${realm}/${name}`)).data
    setData(data);
    console.log("data", data);
  };
  useEffect(() => {
    loadProfile();
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);
  const isMobile = width <= 900;
  let realw = isMobile ? '100%' : '85%';
  let margin = '95px auto 45px auto';

  return (
    <>
      <PageHeader/>
      <Box sx={{
        width: realw,
        // height: '
        margin: margin,
        backgroundColor: containerBg
      }}>
        <h1>{data.name}-{data.realm}</h1>
      </Box>
      <Footer/>
    </>
  );
}

export default Profile;