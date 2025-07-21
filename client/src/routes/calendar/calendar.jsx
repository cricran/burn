import './calendar.css'
import WeekCalendar from '../../components/weekCalendar/weekCalendar'
import Notes from '../../components/notes/notes'
import AddCalendar from '../../components/addCalendar/addCalendar'
import { useState } from 'react'
import useNotificationStore from '../../utils/notificationStore';

const Calendar = () => {
    return (

        <div className='content'>
            <div className='calendar'>
                <WeekCalendar />
                <Notes />
            </div>  
        </div>
    
    )  
}

export default Calendar;
