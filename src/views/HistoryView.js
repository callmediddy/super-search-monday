import React, { useState, useEffect } from 'react';
import { useHistory, Link } from "react-router-dom";
import {  PageHeader, Row, Col, List, Divider, Spin} from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();



const HistoryView = () => {

    const [searchHistory, setSearchHistory] = useState([])
    const [dataLoading, setDataLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const backButton = useHistory()
    const antIcon = <LoadingOutlined style={{ fontSize: 56 }} spin />;

    function clickBackButton(){
        backButton.push('/')
    }

    useEffect(() =>{
        setDataLoading(true)
        loadSearchHistory()
        setDataLoading(false)
        if(!isMounted){
            setIsMounted(true)
        }
    }, [searchHistory, isMounted])


    async function loadSearchHistory() {
        let resp = await monday.storage.instance.getItem('mop')
        if(!resp || !resp.data){
            return
        } else {
            if(resp.data.value !== null){
                let history = resp.data.value;
                setSearchHistory(JSON.parse(history))
            }
        }
        //
    }

    return (
        <div className="container">
            <PageHeader
                className="site-page-header"
                onBack={clickBackButton}
                title="Super Search History"
                subTitle="View your past searches, all stored securely on monday.com!"
            />
            <div className="site-statistic-demo-card">
            {
                dataLoading ?                 
                <Row justify="center">
                <Spin indicator={antIcon} />
            </Row>
            :
                    
                <Row gutter={16}>
                    <Col flex="auto">
                <Divider orientation="left">Past searches...</Divider>
                <List
                //   header={<div>Header</div>}
                //   footer={<div>Footer</div>}
                  bordered
                  dataSource={searchHistory}
                  renderItem={(item, idx) => (
                      <Link to={{
                          pathname: '/search',
                          state: {
                              question: item
                          }
                      }}>
                            <List.Item key={idx}>
                                {item}
                            </List.Item>
                      </Link>

                  )}
                />
                </Col>
                </Row>
            }
            </div>
        </div>
    )
}

export default HistoryView
