import React, {useEffect, useState} from 'react';
import PageHeader from "../AppBar";
import Footer from "../Footer";
import {useParams} from "react-router-dom";
import axios from "axios";
import {baseUrl} from "../../config";
import {Box} from "@mui/material";
import {containerBg} from "../../theme";
import {capitalizeFirstLetter} from "../../containers/Activity";
import PvpBracketBox from "./PvpBracketBox";
import PhotoCard from "./PhotoCard";
import Talents from "./Talents";
import {CLASS_AND_SPECS} from "../../constants/filterSchema";

const Profile = () => {
  let {region, realm, name} = useParams();
  let [data, setData] = useState({});
  document.title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(realm)}`;
  const loadProfile = async () => {
    const data = (await axios.get(baseUrl + `/api/${region}/${realm}/${name}`)).data
    setData(data);
    console.log("data", data);
  };
  useEffect(() => {
    loadProfile();
  }, [region, realm, name]);
  let arenaAndRbg = ['ARENA_2v2', 'ARENA_3v3', 'BATTLEGROUNDS'].map((bracket) => {
    let found = (data?.brackets ?? []).find((b) => b.bracket_type === bracket)
    return (<PvpBracketBox bracket={bracket} rating={found?.rating ?? 0} wins={found?.won ?? 0} loses={found?.lost ?? 0}/>);
  });
  var shuffle
  if (data.class) {
    shuffle = CLASS_AND_SPECS[data.class].map((spec) => {
      let found = (data?.brackets ?? []).find((b) => b.bracket_type.includes(spec))
      return (<PvpBracketBox bracket={spec} rating={found?.rating ?? 0} wins={found?.won ?? 0} loses={found?.lost ?? 0}/>);
    });
  } else {
    shuffle = [];
  }
  return (
    <>
      <PageHeader/>
      <Box sx={{
        width: '100%',
        backgroundColor: containerBg,
        minHeight: '100vh',
        paddingTop: '105px',
        paddingLeft: '3%',
        paddingRight: '3%',
        paddingBottom: '45px',
      }} display={'flex'}
           flexDirection={'column'}>
        <PhotoCard data={data}></PhotoCard>
        <Box display={'flex'}>
          {arenaAndRbg}
        </Box>
        <Box display={'flex'}>
          {shuffle}
        </Box>
        <Talents data={data}></Talents>
      </Box>
      <Footer/>
    </>
  );
}

export default Profile;