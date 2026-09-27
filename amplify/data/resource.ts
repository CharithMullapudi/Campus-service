import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({

  // =========================================
  // SERVICE REQUEST
  // =========================================

  ServiceRequest: a
    .model({
      studentEmail: a.string().required(),
      serviceType: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      // Student can manage their own requests
      allow.owner(),

      // Admins can manage all requests
      allow.group("ADMINS"),
    ]),


  // =========================================
  // ANNOUNCEMENT
  // =========================================

  Announcement: a
    .model({
      title: a.string().required(),
      message: a.string().required(),
      date: a.string().required(),
    })
    .authorization((allow) => [

      // All authenticated users can ONLY read
      allow.authenticated().to(["read"]),

      // Only ADMINS can create/update/delete
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