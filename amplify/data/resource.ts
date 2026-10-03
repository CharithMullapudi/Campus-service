import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  ServiceRequest: a
    .model({
      studentEmail: a.string().required(),
      serviceType: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group("ADMINS"),
    ]),

  Announcement: a
    .model({
      title: a.string().required(),
      message: a.string().required(),
      date: a.string().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.group("ADMINS"),
    ]),

  Room: a
    .model({
      roomNumber: a.string().required(),
      building: a.string().required(),
      capacity: a.integer().required(),
      roomType: a.string().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.group("ADMINS"),
    ]),

  Booking: a
    .model({
      roomId: a.string().required(),
      roomNumber: a.string().required(),
      studentEmail: a.string().required(),
      date: a.string().required(),
      startTime: a.string().required(),
      endTime: a.string().required(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group("ADMINS"),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});