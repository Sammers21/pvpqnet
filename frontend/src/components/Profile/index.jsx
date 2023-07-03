import React, {useEffect, useState} from 'react';
import Header from "../Header";
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
import NotFound from "./NotFound";

const Profile = () => {
  let {region, realm, name} = useParams();
  let [data, setData] = useState({});
  let [status, setStatus] = useState(200);
  let [loading, setLoading] = useState(false);
  document.title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(realm)}`;
  const loadProfile = async (update) => {
    let url
    if (update) {
      url = baseUrl + `/api/${region}/${realm}/${name}/update`;
    } else {
      url = baseUrl + `/api/${region}/${realm}/${name}`;
    }
    setLoading(true)
    let resp = await axios.get(url, {
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });
    setLoading(false)
    const data = resp.data
    setStatus(resp.status);
    setData(data);
    return resp;
  };
  useEffect(() => {
    loadProfile(false);
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
  let normalResp = <><>
    <Header/>
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
      <PhotoCard data={data} loading={loading} update={() => {
        return loadProfile(true);
      }}></PhotoCard>
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
  </>;
  let notFoundResp = <><>
    <Header/>
    <NotFound/>
    <Footer/>
  </>
  </>;
  if (status === 404) {
    return notFoundResp;
  } else {
    return normalResp;
  }
}

export default Profile;