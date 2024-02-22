import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import * as sessionActions from '../../store/session';
import OpenModalMenuItem from './OpenModalMenuItem';
import LoginFormModal from '../LoginFormModal';
import SignupFormModal from '../SignupFormModal';
import profilePic from '../../images/navigation/profile.png'
import './ProfileButton.css'

function ProfileButton({ user }) {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const ulRef = useRef();

  const toggleMenu = (e) => {
    e.stopPropagation(); // Keep from bubbling up to document and triggering closeMenu
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    if (!showMenu) return;

    const closeMenu = (e) => {
      if (ulRef.current && !ulRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', closeMenu);

    return () => document.removeEventListener('click', closeMenu);
  }, [showMenu]);

  const closeMenu = () => setShowMenu(false);

  const logout = (e) => {
    e.preventDefault();
    dispatch(sessionActions.logout());
    closeMenu();
  };

  const ulClassName = "profile-dropdown" + (showMenu ? "" : " hidden");

  return (
    <>
      {/* <button onClick={toggleMenu}>
        <i className="fas fa-user-circle" />
      </button> */}
       <div className='profileBox' style={{display: 'flex', alignItems: 'center'}} onClick={toggleMenu}>
        <img src={profilePic} style={{width:'50px'}}></img>
        <div style={{marginLeft:'10px'}}>
          <i className={`fas fa-caret-${showMenu ? "up" : "down"}`} style={{fontSize: '24px'}}></i>
        </div>
      </div>

      <ul className={ulClassName} ref={ulRef}>
        {user ? (
          <div className='profilemenu'>
            <li className='greetings' >Hello, {user.username}!</li>
            <li className='emailmenu'>{user.email}</li>
            <li className='logoutspace' onClick={logout}>
              <p >Log Out</p>
            </li>
          </div>
        ) : (
          <>
            <OpenModalMenuItem
              itemText="Log In"
              onItemClick={closeMenu}
              modalComponent={<LoginFormModal />}
            />
            <OpenModalMenuItem
              itemText="Sign Up"
              onItemClick={closeMenu}
              modalComponent={<SignupFormModal />}
            />
          </>
        )}
      </ul>
    </>
  );
}

export default ProfileButton;
