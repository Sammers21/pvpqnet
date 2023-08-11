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
import TitlesHistory from "./TitlesHistory";
import Alts from './Alts';

const Profile = () => {
  let {region, realm, name} = useParams();
  let [data, setData] = useState({});
  let [status, setStatus] = useState(200);
  let [loading, setLoading] = useState(false);
  document.title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(realm)} on`;
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener('resize', function () {
      setWidth(window.innerWidth);
    });
    return () => {
      window.removeEventListener('resize', function () {
        setWidth(window.innerWidth);
      });
    }
  }, []);
  const isMobile = width <= 900;

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
    return (
        <PvpBracketBox totalInRow={3}
                       isMobile={isMobile}
                       bracket={bracket}
                       rating={found?.rating ?? 0} wins={found?.won ?? 0}
                       loses={found?.lost ?? 0}/>)
  });
  var shuffle
  if (data.class) {
    let classAndSpec = CLASS_AND_SPECS[data.class];
    shuffle = classAndSpec.map((spec) => {
      let found = (data?.brackets ?? []).find((b) => b.bracket_type.includes(spec))
      return (
        <PvpBracketBox totalInRow={classAndSpec.length} isMobile={isMobile} bracket={spec} rating={found?.rating ?? 0} wins={found?.won ?? 0} loses={found?.lost ?? 0}/>
      );
    });
  } else {
    shuffle = [];
  }
  const titlesHistory = data.achievements?.titles_history.expansions ?? [];
  let normalResp = <><>
    <Header/>
    <Box
      width={'100%'}
      sx={{
        backgroundColor: containerBg,
        minHeight: '100vh',
        paddingTop: '105px',
        paddingLeft: isMobile ? '0' : '3%',
        paddingRight: isMobile ? '0' : '3%',
        paddingBottom: '45px',
      }} display={'flex'} flexDirection={'column'}>
      <PhotoCard isMobile={isMobile} data={data} loading={loading} update={() => {
        return loadProfile(true);
      }}/>
      <Box
        margin={isMobile ? 0 : 1}
        padding={isMobile ? 0 : 1}
        paddingLeft={'10px'}
        paddingRight={'10px'}
        paddingTop={1}
        paddingBottom={0}
        marginTop={0}
        marginBottom={0}
        display={'flex'}
        flexDirection={'row'}
        justifyContent={'space-between'}>
        {arenaAndRbg}
      </Box>
      <Box
        margin={isMobile ? 0 : 1}
        padding={isMobile ? 0 : 1}
        paddingTop={1}
        paddingBottom={0}
        marginTop={0}
        marginBottom={0}
        display={'flex'}
        flexDirection={'row'}
        justifyContent={'space-between'}>
        {shuffle}
      </Box>
      <Talents isMobile={isMobile} data={data}></Talents>
      <TitlesHistory expansions={titlesHistory}></TitlesHistory>
      {/* <Alts isMobile={isMobile} alts={data.alts}></Alts> */}
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