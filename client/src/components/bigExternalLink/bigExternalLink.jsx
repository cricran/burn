import { Link } from 'react-router'
import { Link2 } from 'lucide-react'
import './bigExternalLink.css'


const BigExternalLink = ({ to, text }) => {
    return (
        <Link className='bigExternalLink' to={to}>
            <Link2 />
            <p>{text}</p>
        </Link>
    )
}

export default BigExternalLink


