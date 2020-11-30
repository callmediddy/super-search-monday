import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Empty, Button, Row, Col, Result, Divider, Card, Avatar, Image } from 'antd';
import { DoubleRightOutlined, CompassTwoTone, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import mondaySdk from "monday-sdk-js";
import logo from './../logo.png'
import logo_small from './../logo_small.png'
const { Meta } = Card;

const monday = mondaySdk();

const OptionSelection = () => {

    const [isSaved, setIsSaved] = useState(false)
    const [savedSearches, setSavedSearches] = useState([])
    const [isMounted, setIsMounted] = useState([])
    const [isDataLoading, setIsDataLoading] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    async function loadSavedItems(){
        let resp = await monday.storage.instance.getItem('boop')
        if(!resp || !resp.data){
            return
        } else {
            if(resp.data.value !== null){
                let saved = resp.data.value;
                setSavedSearches(JSON.parse(saved))
            }
        }
    }

    async function deleteSavedItem(idx){
        // console.log(e.value)
        let saved = [...savedSearches]
        // console.log(idx)
        saved.splice(idx, 1)
        let resp = await monday.storage.instance.setItem('boop', JSON.stringify( saved ))
        setSavedSearches(saved)
        // console.log(savedSearches)
        if(saved.length === 0){
            setIsSaved(false)
        }
    }

    useEffect(() => {
        if(isMounted){
            // console.log(savedSearches)
            if(savedSearches.length === 0){
                setIsSaved(false)
            } else {
                setIsSaved(true)
            }
        }
    }, [savedSearches])

    useEffect(() => {
        if(isMounted){
            // console.log(isSaved)
        }
    }, [isSaved])

    useEffect(() => {
        if(isMounted){
            // console.log(savedSearches)
            // Do nothing
            setIsDataLoading(true)
            // Fetch previously saved data
            loadSavedItems()
            // console.log(savedSearches)
            setIsDataLoading(false)
        }
    }, [isMounted])

    useEffect(() => {
        if(isMounted){
            // console.log(savedSearches)
            // Do nothing
        }
    }, [isDataLoading])


    return (
        <div className="container">
            <div className="site-statistic-demo-card">
                <Row gutter={16}>
                    <Col flex="auto">
                        <Result
                            // icon={<SearchOutlined style={{ color: '#1c1f3b' }} />}
                            icon={<Image style={{width: "200px"}} src={logo_small}></Image>}
                            title="Let's begin with Super Search"
                            subTitle="or you can choose to run a search from the past..."
                            extra={[
                            // <Link to="/search" key="0">
                                <Link to={{
                                    pathname: '/search',
                                    state: {
                                        question: "",
                                        searchType: "",
                                        searchGroups: ["All Groups"],
                                        searchColumns: ["All Columns"]
                                    }
                                    }} key="0">
                                <Button type="primary" key="console" size="large">Go to Super Search</Button>
                            </Link>,
                            <Link to="/view/history" key="2">
                                <Button key="history" size="large">View Search History</Button>
                            </Link>,
                            ]}
                        />
                    </Col>
                </Row>
                <Row gutter={16} justify="center">
                    <Col flex="auto">
                    <Divider orientation="left">
                        <h3>Saved Searches</h3>
                    </Divider>
                    {isSaved ? 
                        <Row gutter={16}>
                            {savedSearches.map((item, idx) => (
                            <Col span={6}>
                            <Card
                                actions={[
                                // <PlayCircleTwoTone />,
                                <Link to={{
                                    pathname: '/search',
                                    state: {
                                        question: item.query,
                                        searchType: item.type,
                                        searchGroups: item.groups,
                                        searchColumns: item.columns
                                    }
                                    }}>
                                    <Button type="link" icon={<DoubleRightOutlined />} />
                                </Link>,
                                <Button type="link" icon={<DeleteOutlined />} onClick={async () => await deleteSavedItem()} value={idx} />
                                ]}
                            >
                            <Meta
                                avatar={<Avatar style={{backgroundColor: "#eb4034"}} icon={<CompassTwoTone twoToneColor='#eb4034' />} />}
                                
                                title={item.query}
                                description={
                                    <div>
                                        {item.groups.map(item => (
                                            <Tag color="blue">{item}</Tag>
                                        ))}
                                        {item.columns.map(item => (
                                            <Tag color="green">{item}</Tag>
                                        ))}
                                        <br/>
                                        <Tag color="red">{item.type}</Tag>
                                    </div>
                                }
                                />
                            </Card>
                            </Col>
                            ))}
                        </Row>
                        :
                            <Row gutter={[16, 24]}>
                                <Col flex="auto">
                                    <Empty
                                        description={
                                        <span>
                                            Saved searches appear here...
                                        </span>
                                        }
                                    >
                                    </Empty> 
                                </Col>
                            </Row>
                        }
                    </Col>
                </Row>
            </div>
        </div>
    )

}

export default OptionSelection;