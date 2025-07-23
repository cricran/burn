import './calendar.css'
import WeekCalendar from '../../components/weekCalendar/weekCalendar'
import Notes from '../../components/notes/notes'
import ColorPicker from '../../components/colorPicker/colorPicker'

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
