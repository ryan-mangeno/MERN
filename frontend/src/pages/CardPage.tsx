import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import { Link } from 'react-router-dom';

const CardPage = () =>
{
    return(
        <div>
            <PageTitle />
            <LoggedInName />
            <p>Card features coming soon...</p>
            <p>
                <Link to="/chat">Open Chat</Link>
            </p>
        </div>
    );
}

export default CardPage;