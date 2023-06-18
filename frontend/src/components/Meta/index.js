import PageHeader from "../AppBar";
import React, {useEffect, useState} from "react";
import Footer from "../Footer";
import {useParams} from "react-router-dom";
import {capitalizeFirstLetter} from "../../containers/Activity";
import axios from "axios";
import {baseUrl} from "../../config";
import Grid from "./Grid";

const Meta = ({}) => {
  let [data, setData] = useState({});
  document.title = `Meta`;
  const loadMeta = async () => {
    const data = (await axios.get(baseUrl + `/api/meta`)).data
    setData(data);
    console.log("data", data);
  };
  useEffect(() => {
    loadMeta();
  }, []);
  return (<>
    <PageHeader/>
    <Grid data={data}></Grid>
    <Footer/>
  </>);
}

export default Meta;