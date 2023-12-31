const express = require('express');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

const { restoreUser, requireAuth } = require('../../utils/auth');


const { User, Group, Membership, GroupImage, Venue, Event, EventImage, Attendence } = require('../../db/models');
const membership = require('../../db/models/membership');

const router = express.Router();

// Helper funcs

const processGroupData = (groupData) => {
    const ensuresThisIsAnArray = Array.isArray(groupData) ? groupData : [groupData]; // Converts findByPk and findOne to array

    const groupList = ensuresThisIsAnArray.map(group => {

        const groupJSON = group.toJSON();
        // If the group has memberships, counth them, if not set the count to 0.
        if (group.Memberships){
            groupJSON.numMembers = group.Memberships.length;
        } else {
            groupJSON.numMembers = 0;
        }

        // If the group has images, find the first one with a url and set it as the preview image
        if (group.GroupImages && group.GroupImages.length > 0) {
            const image = group.GroupImages.find(img => img.url);

            if (image) {
                groupJSON.previewImage = image.url
            }
        }

        // Remove membership, groupimages properties
        delete groupJSON.Memberships;
        delete groupJSON.GroupImages;


        return groupJSON
    })
    return groupList
}


const processEventList = (EventList) => {
    const ensuresThisIsAnArray = Array.isArray(EventList) ? EventList : [EventList]; // Converts findByPk and findOne to array

    const eventList = ensuresThisIsAnArray.map(event => {

        const eventJSON = event.toJSON();
        // If the event has attendences, counth them, if not set the count to 0.
        if (event.Attendences){
            eventJSON.numAttending = event.Attendences.length;
        } else {
            eventJSON.numAttending = 0;
        }

        // If the event has images, find the first one with a url and set it as the preview image
        if (event.EventImages && event.EventImages.length > 0) {
            const image = event.EventImages.find(img => img.url);

            if (image) {
                eventJSON.previewImage = image.url
            }
        }

        // Remove membership, eventimages properties
        delete eventJSON.Attendences;
        delete eventJSON.EventImages;


        return eventJSON
    })
    return eventList
}


router.get('/', async (req, res, next) => {
    try {
        const groupData = await Group.findAll({
            include: [
                { model: Membership },
                { model: GroupImage }
            ]
        });


        const groupList = processGroupData(groupData);

        res.json({
            'Groups': groupList
        })
    } catch (error) {
        next(error);
    }

});




router.get('/current', restoreUser, requireAuth, async (req, res, next) => {

    const { user } = req;
    if (!user) {
        const err = new Error('Please login or sign up');
        err.status = 401;
        err.title = 'User authentication failed';
        return next(err);
    }

    const groupData = await Group.findAll({
        where: {
            [Op.or]: [
                { organizerId: user.id}
            ]
        },
        include: [{
            model: Membership,
            attributes: ['status']
        },
        { model: GroupImage }
    ]
    });

    const groupList = processGroupData(groupData);

    res.json({
        Groups: groupList
    })
});



router.get('/:groupId', async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
        include: [
            GroupImage,
            {
                model: User,
                as: 'Organizer',
                attributes:['id', 'firstName', 'lastName']
            },
            Venue,
            Membership
        ]
    });

    const getDetailsOfGroupById = (groupData) => {
        const ensuresThisIsAnArray = Array.isArray(groupData) ? groupData : [groupData];

        const groupList = ensuresThisIsAnArray.map(group => {

            const groupJSON = group.toJSON();

            if (group.Memberships){
                groupJSON.numMembers = group.Memberships.length;
            } else {
                groupJSON.numMembers = 0;
            }

            if (group.GroupImages && group.GroupImages.length > 0) {
                const image = group.GroupImages.find(img => img.url);

                if (image) {
                    groupJSON.previewImage = image.url
                }
            }


            groupJSON.GroupImages = group.GroupImages.map(image => {
                const { groupId, createdAt, updatedAt, ...imageWithoutTimestamps } = image.toJSON();
                return imageWithoutTimestamps;
            });


            delete groupJSON.Memberships;

            delete groupJSON.previewImage;


            if (groupJSON.Venues) {
                groupJSON.Venues.forEach(venue => {
                    delete venue.createdAt;
                    delete venue.updatedAt;
                });
            }

            (groupJSON)
            return groupJSON
        })
        return groupList

    }

    if (group) {
        const groupList = getDetailsOfGroupById(group);

        return res.json(Array.isArray(groupList) && groupList.length === 1 ? groupList[0] : groupList);
    } else {
        res.status(404).json({
            message: "Group couldn't be found"
        });
    }
});


router.get('/', async (req, res, next) => {
    try{
        const events = await Event.findAll({
            where: isWhere,
            include:[
                {model: Attendence},
                {model: EventImage},
                {
                    model: Group,
                    attributes: ['id','name','city','state'],
                    include: [
                        {
                            model:Venue,

                            attributes:['id', 'city', 'state'],
                        }
                    ]
                }
            ],
            limit: size,
            offset: (page - 1) * size
        });

        const thisWorksOnlyInHere = (EventList) => {
            const ensuresThisIsAnArray = Array.isArray(EventList) ? EventList : [EventList]; // Converts findByPk and findOne to array

            const eventList = ensuresThisIsAnArray.map(event => {

            const eventJSON = event.toJSON();

            if (event.Attendences){
                eventJSON.numAttending = event.Attendences.length;
            } else {
                eventJSON.numAttending = 0;
            }

            if (event.EventImages && event.EventImages.length > 0) {
                const image = event.EventImages.find(img => img.url);

                if (image) {
                    eventJSON.previewImage = image.url
                }
            }

            if (event.Group.Venues && event.Group.Venues.length > 0) {
                eventJSON.Group.Venue = event.Group.Venues[0];
            } else {
                eventJSON.Group.Venue = null;
            }

            delete eventJSON.Attendences;
            delete eventJSON.EventImages;
            delete eventJSON.Group.Venues;

            // Reorder the properties cause this one is being a butt
            const reorderedEvent = {
                id: eventJSON.id,
                groupId: eventJSON.groupId,
                venueId: eventJSON.venueId,
                name: eventJSON.name,
                type: eventJSON.type,
                startDate: eventJSON.startDate,
                endDate: eventJSON.endDate,
                numAttending: eventJSON.numAttending,
                previewImage: eventJSON.previewImage,
                Group: eventJSON.Group,
                Venue: eventJSON.Group.Venue
            };

            (reorderedEvent)
            return reorderedEvent
        })
         return eventList
        }

        const eventList = thisWorksOnlyInHere(events);



        res.json({Events: eventList})
    } catch (error){
        next(error)
    }
})


router.get('/:groupId/venues', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { user } = req;
        ("This is it",groupId)

        if(!user){
            const err = new Error('Please login or sign up');
            err.status = 401;
            err.title = 'User authentication failed';
            return next(err);
        }

        const group = await Group.findByPk(groupId);
        if(!group) return res.status(403).json({"message": "Group couldn't be found"})

        if (group.organizerId !== req.user.id && Membership.status !== 'co-host') {
            return res.status(403).json({
                message: "You don't have permission to see this venue"
            });
        }



        const venues = await Venue.findAll({
            where: {
                groupId: groupId
            },
            attributes: ["id","groupId","address","city","state","lat","lng"]
        });

        if (venues.length === 0){
            return res.status(404).json({
                "message": "Group couldn't be found"
            })
        }



        res.json({
            Venues: venues
        })

    } catch (error) {
        next(error)
    }


});

router.get('/:groupId/events', async (req, res, next) => {
    try{
        const thisgroupId = req.params.groupId

        const group = await Group.findByPk(thisgroupId);

        if(!group) return res.status(403).json({"message": "Group couldn't be found"})


        const events = await Event.findAll({
            where: {
                groupId: thisgroupId
            },
            include:[
                {model: Attendence},
                {model: EventImage},
                {
                    model: Group,
                    attributes: ['id','name','city','state'],
                    include: [
                        {
                            model:Venue,
                            attributes:['id', 'city', 'state']
                        }
                    ]
                }
            ]
        });

        const thisReordersProperly= (EventList) => {
            const ensuresThisIsAnArray = Array.isArray(EventList) ? EventList : [EventList]; // Converts findByPk and findOne to array

            const eventList = ensuresThisIsAnArray.map(event => {

                const eventJSON = event.toJSON();

                if (event.Attendences){
                    eventJSON.numAttending = event.Attendences.length;
                } else {
                    eventJSON.numAttending = 0;
                }

                if (event.EventImages && event.EventImages.length > 0) {
                    const image = event.EventImages.find(img => img.url);

                    if (image) {
                        eventJSON.previewImage = image.url
                    }
                }

                if (event.Group.Venues && event.Group.Venues.length > 0) {
                    eventJSON.Venue = event.Group.Venues[0];
                } else {
                    eventJSON.Venue = null;
                }

                delete eventJSON.Attendences;
                delete eventJSON.EventImages;
                delete eventJSON.Group.Venues;

                // Reorder the properties cause this one is being a butt
                const reorderedEvent = {
                    id: eventJSON.id,
                    groupId: eventJSON.groupId,
                    venueId: eventJSON.venueId,
                    name: eventJSON.name,
                    type: eventJSON.type,
                    startDate: eventJSON.startDate,
                    endDate: eventJSON.endDate,
                    numAttending: eventJSON.numAttending,
                    previewImage: eventJSON.previewImage,
                    Group: eventJSON.Group,
                    Venue: eventJSON.Venue
                };

                (reorderedEvent)
                return reorderedEvent
            })
            return eventList
        }

        if(events) {
            const eventList = thisReordersProperly(events);
            res.json({Events: eventList})
        } else {
            res.status(404).json({
                message: "Group couldn't be found"
            });
        }
    } catch (error){
        next(error)
    }
});

router.get('/:groupId/members', async (req, res, next) => {
    try {
        const thisGroupId = req.params.groupId;
        const { user } = req;


        if(!user){
            const err = new Error('Please login or sign up');
            err.status = 401;
            err.title = 'User authentication failed';
            return next(err);
        }


        const group = await Group.findByPk(thisGroupId);
        const membership = await Membership.findByPk(thisGroupId)

        if (!group) {
            return res.status(404).json({ message: "Group couldn't be found" });
        }


        const members = await Membership.findAll({
            where: { groupId: thisGroupId },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });


        const formattedMembers = members.map(member => ({
            id: member.User.id,
            firstName: member.User.firstName,
            lastName: member.User.lastName,
            Membership: {
                status: member.status
            }
        }));

        // (membership.status)
        // (req.user.id)
        // (group.organizerId)

        if ( membership.status === 'co-host' || group.organizerId === req.user.id) {
            res.json({ Members: formattedMembers });
        } else {
            const nonPendingMembers = formattedMembers.filter(member => member.Membership.status !== 'pending');
            res.json({ Members: nonPendingMembers });
        }
    } catch (error) {
        next(error);
    }
});















/* POST */

router.post('/', restoreUser, requireAuth, async (req, res, next) => {
    const { name, about, type, private, city, state } = req.body
    const { user } = req

    if (!user) {
        const err = new Error('Please login or sign up');
        err.status = 401;
        err.title = 'User authentication failed';
        return next(err);
    }

    try {
        const newGroup = await Group.create({
            organizerId: user.id,
            name,
            about,
            type,
            private,
            city,
            state
        })
        res.status(201).json(newGroup)
    } catch (error) {

        if (error instanceof Sequelize.ValidationError) {
            let errors = {};
            error.errors.forEach(e => {
              errors[e.path] = e.message;
            });

            return res.status(400).json({
              message: 'Validation Error',
              errors: errors
            });
          }

          res.status(400).json({
            message: 'Bad Request'
          });

    }


})


router.post('/:groupId/images', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { url, preview } = req.body

        const group = await Group.findByPk(groupId)

        if(!group) return res.status(403).json({"message": "Group couldn't be found"})

        if (group.organizerId !== req.user.id) {
            return res.status(403).json({
                message: "You don't have permission to create this venue"
            });
        }

        const image = await GroupImage.create({
            groupId: groupId,
            url,
            preview
        })

        res.json({
            id: image.id,
            url: image.url,
            preview: image.preview
        })
    } catch (error) {
        if(error instanceof Sequelize.ValidationError) {

            return res.status(400).json({
                message: 'Validation Error',
                errors: error.errors.map(e => {
                  (e);
                  return {
                    [e.path]: e.message
                  };
                })
              });
        }

        res.status(400).json({
            message: 'Bad Request'
        })
    }
})

router.post('/:groupId/venues', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const thisGroupId = req.params.groupId;
        const { address, city, state, lat, lng } = req.body

        const group = await Group.findByPk(thisGroupId)



        if(!group) return res.status(403).json({"message": "Group couldn't be found"})

        if (group.organizerId !== req.user.id && Membership.status !== 'co-host') {
            return res.status(403).json({
                message: "You don't have permission to create this venue"
            });
        }

        const venue = await Venue.create({
            groupId: thisGroupId,
            address,
            city,
            state,
            lat,
            lng
        })

        res.json({
            address: venue.address,
            city: venue.city,
            state: venue.state,
            lat: venue.lat,
            lng: venue.lng
        })
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, curr) => {
                acc[curr.path] = curr.message;
                return acc;
            }, {});

            res.status(400).json({
                message: 'Bad Request',
                errors
            });
        } else {
            next(error);
        }
    }

})


router.post('/:groupId/events', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const thisGroupId = req.params.groupId;
        const { groupId, venueId, name, type, capacity, price, description, startDate, endDate } = req.body

        const group = await Group.findByPk(thisGroupId)

        const venue = await Venue.findByPk(venueId)

        if (!venue) return res.status(400).json({"message": "Venue couldn't be found"})

        if(!group) return res.status(403).json({"message": "Group couldn't be found"})

        if (group.organizerId !== req.user.id && Membership.status !== 'co-host') {
            return res.status(403).json({
                message: "You don't have permission to create this events"
            });
        }


        const event = await Event.create({
            groupId: thisGroupId,
            venueId: venue.id,
            name,
            type,
            capacity,
            price,
            description,
            startDate,
            endDate
        });



        res.json({
            groupId: thisGroupId,
            venueId: venue.id,
            name: event.name,
            type: event.type,
            capacity: event.capacity,
            price: event.price,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate
        })
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.reduce((acc, curr) => {
                acc[curr.path] = curr.message;
                return acc;
            }, {});


            res.status(400).json({
                message: 'Bad Request',
                errors
            });
        } else {
            next(error);
        }
    }
});


router.post('/:groupId/membership', restoreUser, requireAuth, async (req, res) => {
    try {

        const thisGroupId = req.params.groupId
        const group = await Group.findByPk(thisGroupId)

        if (!group) {
            return res.status(404).json(
                {
                    message: "Group couldn't be found"
            });
        }

        const existingMembership = await Membership.findOne({
            where:{
                groupId: group.id,
                userId: req.user.id
            }
        });

        if (existingMembership) {
            if (existingMembership.status === 'pending') {
            return res.status(400).json({
                message: 'Membership has already been requested'
            });
            } else if (
                existingMembership.status === 'member'
                || existingMembership.status === 'co-host'
            ){
            return res.status(400).json({
                message: 'User is already a member of the group'
            });
            }
        }

        const newMembership = await Membership.create(
            {
                userId: req.user.id,
                groupId: thisGroupId,
                status: 'pending'
        });
        res.status(200).json({
            id: thisGroupId,
            groupId:thisGroupId,
            memberId: newMembership.id,
            status: newMembership.status
        });

    } catch (err) {
        console.error('Error: ', err);
    }
  });








/*  DELETE   */
router.delete('/:groupId', restoreUser, requireAuth, async (req, res) => {
    const thisGroupId = req.params.groupId

    const groupDelete = await Group.findByPk(thisGroupId)
    const group = await Group.findByPk(thisGroupId);

    if(!groupDelete) {
        return res.status(404).json({
            message: "Group couldn't be found"
        })
    }

    if (group.organizerId !== req.user.id) {
        return res.status(403).json({
            message: "You don't have permission to edit this group"
        });
    }


    groupDelete.destroy();

    res.json({
        'message': "Successfully deleted"
    })
})



router.delete('/:groupId/membership/:memberId', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const { groupId, memberId } = req.params;
        const group = await Group.findByPk(groupId);

        if (!group) {
            return res.status(404).json({ message: "Group couldn't be found" });
        }
        if (group.organizerId !== req.user.id && Membership.status !== 'co-host') {
            return res.status(403).json({
                message: "You don't have permission to edit this group"
            });
        }


        const user = await User.findByPk(memberId);

        if (!user) {
            return res.status(404).json({ message: "User couldn't be found" });
        }

        const membership = await Membership.findOne({
            where: {
                groupId: group.id,
                userId: user.id
            }
        });

        if (!membership) {
            return res.status(404).json({ message: "Membership does not exist for this User" });
        }

        if (group.organizerId !== req.user.id && user.id !== req.user.id) {
            return res.status(403).json({ message: "You don't have permission to delete this membership" });
        }

        await membership.destroy();

        res.status(200).json({ message: "Successfully deleted membership from group" });

    } catch (err) {
        console.error('Error: ', err);
        next(err);
    }
});








/*       PUT      */
router.put('/:groupId', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { name, about, type, private, city, state } = req.body

        const group = await Group.findByPk(groupId);

        if(!group){
            return res.status(404).json({
                message: "Group couldn't be found"
            })
        }

        if (group.organizerId !== req.user.id) {
            return res.status(403).json({
                message: "You don't have permission to edit this group"
            });
        }

        group.name = name !== undefined ? name : group.name;
        group.about = about !== undefined ? about : group.about;
        group.type = type !== undefined ? type : group.type;
        group.private = private !== undefined ? private : group.private;
        group.city = city !== undefined ? city : group.city;
        group.state = state !== undefined ? state : group.state;

        await group.save();

        res.json(group)


    } catch (error) {

        if (error instanceof Sequelize.ValidationError) {
            let errors = {};
            error.errors.forEach(e => {
              errors[e.path] = e.message;
            });

            return res.status(400).json({
              message: 'Validation Error',
              errors: errors
            });
          }

          res.status(400).json({
            message: 'Bad Request'
          });

    }
})



router.put('/:groupId/membership', restoreUser, requireAuth, async (req, res, next) => {
    try {
        const thisGroupId = req.params.groupId
        const group = await Group.findByPk(thisGroupId)

        if (!group) {
            return res.status(404).json({
                message: "Group couldn't be found"
            });
        }

        const existingMembership = await Membership.findOne({
            where:{
                groupId: group.id,
                userId: req.user.id
            }
        });


        if(!existingMembership) {
            return res.status(404).json({
                message: "Membership between the user and the group does not exist"
            });
        }

        if (req.body.status === 'pending'){
            return res.status(400).json({
                message: "Bad Request",
                errors: {
                    status: 'Cannot change a membership status to pending'
                }
            })
        }

        if (['member', 'co-host'].indexOf(req.body.status) === -1) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }


        if (group.organizerId !== req.user.id && existingMembership.status !== 'co-host') {
            return res.status(403).json({
                message: "You don't have permission to change this membership status"
            });
        } else if (existingMembership.status === 'member' && group.organizerId !== req.user.id) {
            return res.status(403).json({
                message: "You don't have permission to change this membership status"
            });
        } else {
            existingMembership.status = req.body.status;
            await existingMembership.save();
            return res.status(200).json({
                id: existingMembership.id,
                groupId: group.id,
                memberId: req.user.id,
                status: existingMembership.status
            })
        };
    } catch (err) {
        console.error('Error: ', err);
        next(err)
    }
});

// router.put('/:groupId/membership', restoreUser, requireAuth, async (req, res, next) => {
//     try {

//         const thisGroupId = req.params.groupId
//         const group = await Group.findByPk(thisGroupId)

//         if (!group) {
//             return res.status(404).json(
//                 {
//                     message: "Group couldn't be found"
//             });
//         }

//         const existingMembership = await Membership.findOne({
//             where:{
//                 groupId: group.id,
//                 userId: req.user.id
//             }
//         });

//         ('/****************************************/')
//         ('What is this?',existingMembership)

//         if(!existingMembership) {
//             return res.status(400).json({
//                 message: "Membership between the user and the group does not exist"
//               });
//         }

//         if (req.body.status === 'pending'){
//             return res.status(400).json({
//                 message: "Bad Request",
//                 errors: {
//                     status: 'Cannot change a membership status to pending'
//                 }
//             })
//         }

//         if (group.organizerId !== req.user.id || existingMembership.status !== 'co-host') {
//             return res.status(403).json({
//                 message: "You don't have permission to create this venue"
//             });
//         } else {
//             existingMembership.status = req.body.status;
//             await existingMembership.save();
//             return res.status(200).json({
//                 id: existingMembership.id,
//                 groupId: group.id,
//                 memberId: req.user.id,
//                 status: existingMembership.status
//         })
//     };
//     } catch (err) {
//         console.error('Error: ', err);
//         next(err)
//     }
// });







module.exports = router;
