const express = require('express');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const { restoreUser, requireAuth } = require('../../utils/auth');

const { User, Group, Membership, GroupImage, Venue, Event, EventImage, Attendence } = require('../../db/models');

const router = express.Router();

router.put('/:venueId', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const venuesId = req.params.venueId;
        console.log('This is the venue Id', venuesId)
        const { address, city, state, lat, lng } = req.body

        const venue = await Venue.findByPk(venuesId);
        console.log('*****************************************************')
        console.log('This is inside our venue:', venue)

        if(!venue){
            return res.status(404).json({
                message: "Venue couldn't be found"
            })
        }

        const membership = await Membership.findOne({
            where: {
                userId: req.user.id,
                groupId: venue.groupId,
                status: 'co-host'
            }
        })
        console.log('*****************************************************')
        console.log('This is inside our membership:', membership)

        if (!membership || membership.userId !== req.user.id) {
            return res.status(403).json({
                message: "You don't have permission to edit this venue"
            });
        }
        console.log('Did I get here?')

        venue.address = address !== undefined ? address : venue.address;
        venue.city = city !== undefined ? city : venue.city;
        venue.state = state !== undefined ? state : venue.state;
        venue.lat = lat !== undefined ? lat : venue.lat;
        venue.lng = lng !== undefined ? lng : venue.lng;


        await venue.save();

        res.json(venue)


    } catch (error) {
        if(error instanceof Sequelize.ValidationError) {

            return res.status(400).json({
                message: 'Validation Error',
                errors: error.errors.map(e => {
                  return {
                    [e.path]: e.message
                  };
                })
              });
        }
    }
})




module.exports = router;
