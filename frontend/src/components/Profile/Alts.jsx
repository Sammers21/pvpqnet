import React from 'react';
import { Box, Typography, Divider, Link } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { aroundColor, borderRadius, containerBg } from "../../theme";
import { profileUrl, getClassNameColor } from "../DataTable/useColumns";


const Alts = ({ isMobile, alts }) => {
    if (alts === undefined) {
        alts = [];
    }
    return (
        <>
            <Box
                sx={{
                    backgroundColor: alpha(aroundColor, 0.3),
                    borderRadius: borderRadius,
                    marginTop: '15px', marginBottom: '15px',
                    width: '100%',
                    paddingTop: '15px',
                    paddingBottom: '15px',
                    paddingLeft: '15px',
                    paddingRight: '15px',
                }}>
                <Typography variant={'h5'}>Alts</Typography>
                <Divider />
                {alts.map((alt) => {
                    const name = alt.name;
                    const realm = alt.realm;
                    const url = profileUrl(alt, alt.region);
                    //                 let name = {
                    //   const wowClass = record?.character?.class || record?.class;
                    //   let name = record?.character?.name || record?.name;
                    //   if(isMobile){
                    //     // const cut = name.length > 6 ? '..' : '';
                    //     name = name.substring(0, 8);
                    //   }
                    //   const url = profileUrl(record, region);
                    //   return <Typography color={getClassNameColor(wowClass)}>
                    //     <Link sx={{textDecoration: "none", boxShadow: "none"}}  href={url} color={getClassNameColor(wowClass)}>{name}</Link>
                    //   </Typography>;
                    // }


                    return (<Box sx={{
                        display: 'flex', alignItems: 'center',
                    }}>
                        <Typography color={getClassNameColor(alt.class)}>
                            <Link sx={{ textDecoration: "none", boxShadow: "none" }} href={url} color={getClassNameColor(alt.class)}>{name}-{realm}</Link>
                        </Typography>
                    </Box>)
                })}
            </Box>
        </>
    )
}

export default Alts;