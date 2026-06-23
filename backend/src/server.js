import cors from "cors";
import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const defaultRehabCenter = {
  id: "rehabcare-colombo",
  name: "RehabCare Colombo",
  code: "rcc",
  email: "admin@rehabcare-colombo.local",
  registrationNo: "RCC-REG-001",
  phone: "",
  address: "Colombo, Sri Lanka",
};

const rehabCenterSchema = new mongoose.Schema(
  {
    centerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    email: { type: String, default: "" },
    registrationNo: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true },
);

const customUserFieldSchema = new mongoose.Schema(
  {
    fieldId: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, default: "" },
    editableByUser: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    rehabCenterId: { type: String, required: true, index: true },
    rehabCenterName: { type: String, required: true },
    centerCode: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "therapist", "patient"],
      required: true,
      index: true,
    },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    customFields: { type: [customUserFieldSchema], default: [] },
    firstLogin: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const profileFieldSchema = new mongoose.Schema(
  {
    rehabCenterId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["therapist", "patient"],
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    label: { type: String, required: true },
    editableByUser: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

profileFieldSchema.index(
  { rehabCenterId: 1, role: 1, key: 1 },
  { unique: true },
);

const User = mongoose.model("User", userSchema);
const RehabCenter = mongoose.model("RehabCenter", rehabCenterSchema);
const ProfileField = mongoose.model("ProfileField", profileFieldSchema);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function makeTemporaryPassword() {
  const digits = crypto.randomInt(100000, 999999);
  return `RA-${digits}`;
}

function roleCode(role) {
  if (role === "therapist") return "t";
  if (role === "patient") return "p";
  return "a";
}

async function nextUsername(role) {
  const prefix = `${defaultRehabCenter.code}_${roleCode(role)}_`;
  const users = await User.find({
    rehabCenterId: defaultRehabCenter.id,
    role,
    username: { $regex: `^${prefix}\\d{3,}$` },
  }).select("username");

  const maxSequence = users.reduce((max, user) => {
    const sequence = Number(user.username.replace(prefix, ""));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);

  return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
}

function normalizeFieldKey(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function publicProfileField(field) {
  return {
    id: field._id.toString(),
    role: field.role,
    key: field.key,
    label: field.label,
    editableByUser: field.editableByUser,
    isActive: field.isActive,
  };
}

function mapCustomFieldValues(definitions, submittedFields = []) {
  const fields = Array.isArray(submittedFields) ? submittedFields : [];

  return definitions.map((definition) => {
    const fieldId = definition._id.toString();
    const submitted = fields.find((field) => field.fieldId === fieldId);

    return {
      fieldId,
      label: definition.label,
      value: typeof submitted?.value === "string" ? submitted.value.trim() : "",
      editableByUser: definition.editableByUser,
    };
  });
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    rehabCenterId: user.rehabCenterId,
    rehabCenterName: user.rehabCenterName,
    username: user.username,
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    email: user.email,
    phone: user.phone,
    customFields: user.customFields ?? [],
    firstLogin: user.firstLogin,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function publicRehabCenter(center) {
  return {
    id: center.centerId,
    name: center.name,
    code: center.code,
    email: center.email,
    registrationNo: center.registrationNo,
    phone: center.phone,
    address: center.address,
  };
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = await User.findOne({
    username: identifier.toLowerCase(),
    isActive: true,
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  res.json({
    user: publicUser(user),
    token: crypto.randomBytes(24).toString("hex"),
  });
});

app.get("/api/profile/:id", async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    rehabCenterId: defaultRehabCenter.id,
    role: { $in: ["therapist", "patient"] },
    isActive: true,
  });

  if (!user) {
    return res.status(404).json({ message: "Profile not found." });
  }

  res.json({ user: publicUser(user) });
});

app.put("/api/profile/:id", async (req, res) => {
  const { firstName, lastName = "", email = "", phone = "", customFields = [] } = req.body;

  if (!firstName?.trim()) {
    return res.status(400).json({ message: "First name is required." });
  }

  if (!email?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  const user = await User.findOne({
    _id: req.params.id,
    rehabCenterId: defaultRehabCenter.id,
    role: { $in: ["therapist", "patient"] },
    isActive: true,
  });

  if (!user) {
    return res.status(404).json({ message: "Profile not found." });
  }

  const submittedFields = Array.isArray(customFields) ? customFields : [];
  user.firstName = firstName.trim();
  user.lastName = lastName.trim();
  user.email = email.trim();
  user.phone = phone.trim();
  user.customFields = (user.customFields ?? []).map((field) => {
    if (!field.editableByUser) return field;
    const submitted = submittedFields.find((item) => item.fieldId === field.fieldId);
    return {
      fieldId: field.fieldId,
      label: field.label,
      value: typeof submitted?.value === "string" ? submitted.value.trim() : field.value,
      editableByUser: field.editableByUser,
    };
  });

  await user.save();

  res.json({ user: publicUser(user) });
});

app.get("/api/admin/users", async (_req, res) => {
  const users = await User.find({
    rehabCenterId: defaultRehabCenter.id,
    role: { $in: ["therapist", "patient"] },
  }).sort({ createdAt: -1 });

  res.json({ users: users.map(publicUser) });
});

app.get("/api/admin/dashboard", async (_req, res) => {
  const users = await User.find({
    rehabCenterId: defaultRehabCenter.id,
    role: { $in: ["therapist", "patient"] },
  });

  const count = (role, predicate = () => true) =>
    users.filter((user) => user.role === role && predicate(user)).length;

  res.json({
    summary: {
      activePatients: count("patient", (user) => user.isActive),
      activeTherapists: count("therapist", (user) => user.isActive),
      pendingPatients: count("patient", (user) => user.firstLogin),
      pendingTherapists: count("therapist", (user) => user.firstLogin),
      inactiveAccounts: users.filter((user) => !user.isActive).length,
    },
    recentUsers: users
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(publicUser),
  });
});

app.get("/api/admin/rehab-center", async (_req, res) => {
  let center = await RehabCenter.findOne({ centerId: defaultRehabCenter.id });
  if (!center) {
    await ensureDefaultRehabCenter();
    center = await RehabCenter.findOne({ centerId: defaultRehabCenter.id });
  }
  res.json({ rehabCenter: publicRehabCenter(center) });
});

app.put("/api/admin/rehab-center", async (req, res) => {
  const { name, email, registrationNo, phone, address } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: "Rehab center name is required." });
  }

  const center = await RehabCenter.findOneAndUpdate(
    { centerId: defaultRehabCenter.id },
    {
      name: name.trim(),
      email: email?.trim() ?? "",
      registrationNo: registrationNo?.trim() ?? "",
      phone: phone?.trim() ?? "",
      address: address?.trim() ?? "",
    },
    { new: true, runValidators: true },
  );

  if (!center) {
    return res.status(404).json({ message: "Rehab center not found." });
  }

  await User.updateMany(
    { rehabCenterId: defaultRehabCenter.id },
    { rehabCenterName: center.name },
  );

  res.json({ rehabCenter: publicRehabCenter(center) });
});

app.get("/api/admin/profile-fields/:role", async (req, res) => {
  const { role } = req.params;

  if (!["therapist", "patient"].includes(role)) {
    return res.status(400).json({ message: "Role must be therapist or patient." });
  }

  const fields = await ProfileField.find({
    rehabCenterId: defaultRehabCenter.id,
    role,
    isActive: true,
  }).sort({ createdAt: 1 });

  res.json({ fields: fields.map(publicProfileField) });
});

app.post("/api/admin/profile-fields/:role", async (req, res) => {
  const { role } = req.params;
  const { label, editableByUser = true } = req.body;

  if (!["therapist", "patient"].includes(role)) {
    return res.status(400).json({ message: "Role must be therapist or patient." });
  }

  if (!label?.trim()) {
    return res.status(400).json({ message: "Field label is required." });
  }

  const key = normalizeFieldKey(label);
  if (!key) {
    return res.status(400).json({ message: "Use letters or numbers in the field label." });
  }

  try {
    const field = await ProfileField.create({
      rehabCenterId: defaultRehabCenter.id,
      role,
      key,
      label: label.trim(),
      editableByUser: Boolean(editableByUser),
      isActive: true,
    });

    res.status(201).json({ field: publicProfileField(field) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That field already exists for this user type." });
    }
    throw error;
  }
});

app.put("/api/admin/profile-fields/:role/:id", async (req, res) => {
  const { role, id } = req.params;
  const { label, editableByUser = true } = req.body;

  if (!["therapist", "patient"].includes(role)) {
    return res.status(400).json({ message: "Role must be therapist or patient." });
  }

  if (!label?.trim()) {
    return res.status(400).json({ message: "Field label is required." });
  }

  const key = normalizeFieldKey(label);
  if (!key) {
    return res.status(400).json({ message: "Use letters or numbers in the field label." });
  }

  try {
    const field = await ProfileField.findOneAndUpdate(
      {
        _id: id,
        rehabCenterId: defaultRehabCenter.id,
        role,
        isActive: true,
      },
      {
        key,
        label: label.trim(),
        editableByUser: Boolean(editableByUser),
      },
      { new: true, runValidators: true },
    );

    if (!field) {
      return res.status(404).json({ message: "Profile field not found." });
    }

    await User.updateMany(
      {
        rehabCenterId: defaultRehabCenter.id,
        role,
        "customFields.fieldId": id,
      },
      {
        $set: {
          "customFields.$.label": field.label,
          "customFields.$.editableByUser": field.editableByUser,
        },
      },
    );

    res.json({ field: publicProfileField(field) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That field already exists for this user type." });
    }
    throw error;
  }
});

app.delete("/api/admin/profile-fields/:role/:id", async (req, res) => {
  const { role, id } = req.params;

  if (!["therapist", "patient"].includes(role)) {
    return res.status(400).json({ message: "Role must be therapist or patient." });
  }

  const field = await ProfileField.findOneAndUpdate(
    {
      _id: id,
      rehabCenterId: defaultRehabCenter.id,
      role,
      isActive: true,
    },
    { isActive: false },
    { new: true },
  );

  if (!field) {
    return res.status(404).json({ message: "Profile field not found." });
  }

  await User.updateMany(
    {
      rehabCenterId: defaultRehabCenter.id,
      role,
    },
    {
      $pull: {
        customFields: { fieldId: id },
      },
    },
  );

  res.json({ deleted: true, field: publicProfileField(field) });
});

app.post("/api/admin/users", async (req, res) => {
  const {
    role,
    firstName,
    lastName = "",
    email = "",
    phone = "",
    customFields = [],
  } = req.body;

  if (!["therapist", "patient"].includes(role)) {
    return res.status(400).json({ message: "Role must be therapist or patient." });
  }

  if (!firstName?.trim()) {
    return res.status(400).json({ message: "First name is required." });
  }

  if (!email?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  const fieldDefinitions = await ProfileField.find({
    rehabCenterId: defaultRehabCenter.id,
    role,
    isActive: true,
  }).sort({ createdAt: 1 });
  const username = await nextUsername(role);
  const temporaryPassword = makeTemporaryPassword();

  const user = await User.create({
    rehabCenterId: defaultRehabCenter.id,
    rehabCenterName: defaultRehabCenter.name,
    centerCode: defaultRehabCenter.code,
    role,
    username,
    passwordHash: hashPassword(temporaryPassword),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone.trim(),
    customFields: mapCustomFieldValues(fieldDefinitions, customFields),
    firstLogin: true,
  });

  res.status(201).json({
    user: publicUser(user),
    credentials: {
      username,
      temporaryPassword,
    },
  });
});

app.put("/api/admin/users/:id", async (req, res) => {
  const {
    firstName,
    lastName = "",
    email = "",
    phone = "",
    isActive,
    customFields = [],
  } = req.body;

  if (!firstName?.trim()) {
    return res.status(400).json({ message: "First name is required." });
  }

  if (!email?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: "Email and phone are required." });
  }

  const user = await User.findOne({
    _id: req.params.id,
    rehabCenterId: defaultRehabCenter.id,
    role: { $in: ["therapist", "patient"] },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const fieldDefinitions = await ProfileField.find({
    rehabCenterId: defaultRehabCenter.id,
    role: user.role,
    isActive: true,
  }).sort({ createdAt: 1 });

  user.firstName = firstName.trim();
  user.lastName = lastName.trim();
  user.email = email.trim();
  user.phone = phone.trim();
  user.isActive = Boolean(isActive);
  user.customFields = mapCustomFieldValues(
    fieldDefinitions,
    Array.isArray(customFields) && customFields.length ? customFields : user.customFields,
  );

  await user.save();

  res.json({ user: publicUser(user) });
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const user = await User.findOneAndDelete(
    {
      _id: req.params.id,
      rehabCenterId: defaultRehabCenter.id,
      role: { $in: ["therapist", "patient"] },
    },
  );

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({ deleted: true, user: publicUser(user) });
});

async function ensureDefaultRehabCenter() {
  await RehabCenter.findOneAndUpdate(
    { centerId: defaultRehabCenter.id },
    {
      $setOnInsert: {
        centerId: defaultRehabCenter.id,
        name: defaultRehabCenter.name,
        code: defaultRehabCenter.code,
        email: defaultRehabCenter.email,
        registrationNo: defaultRehabCenter.registrationNo,
        phone: defaultRehabCenter.phone,
        address: defaultRehabCenter.address,
      },
    },
    { upsert: true, new: true },
  );
}

async function ensureDefaultAdmin() {
  const existing = await User.findOne({
    rehabCenterId: defaultRehabCenter.id,
    role: "admin",
  });

  if (existing) return;

  const username = `${defaultRehabCenter.code}_a_001`;
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@1234";

  await User.create({
    rehabCenterId: defaultRehabCenter.id,
    rehabCenterName: defaultRehabCenter.name,
    centerCode: defaultRehabCenter.code,
    role: "admin",
    username,
    passwordHash: hashPassword(password),
    firstName: "Rehab",
    lastName: "Admin",
    email: "admin@rehabcare-colombo.local",
    firstLogin: true,
  });

  console.log(`Default admin ready: ${username}`);
}

async function startServer() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env.");
  }

  await mongoose.connect(mongoUri);
  await ensureDefaultRehabCenter();
  await ensureDefaultAdmin();
  console.log("MongoDB connected");

  app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
