package com.v2ray.compose.data

import androidx.room.*
import com.v2ray.compose.model.ProtocolType
import com.v2ray.compose.model.V2RayProfile
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "profiles")
data class ProfileEntity(
    @PrimaryKey val id: String,
    val remark: String,
    val address: String,
    val port: Int,
    val protocol: String,
    val uuidOrPassword: String,
    val security: String,
    val network: String,
    val path: String,
    val host: String,
    val sni: String,
    val alterId: Int,
    val isTls: Boolean,
    val isReality: Boolean = false,
    val publicKey: String = "",
    val shortId: String = "",
    val fingerprint: String = "",
    val isSelected: Boolean,
    val pingMs: Int,
    val subscriptionUrl: String?,
    val rawUri: String
) {
    fun toDomainModel(): V2RayProfile {
        return V2RayProfile(
            id = id,
            remark = remark,
            address = address,
            port = port,
            protocol = ProtocolType.fromScheme(protocol),
            uuidOrPassword = uuidOrPassword,
            security = security,
            network = network,
            path = path,
            host = host,
            sni = sni,
            alterId = alterId,
            isTls = isTls,
            isReality = isReality,
            publicKey = publicKey,
            shortId = shortId,
            fingerprint = fingerprint,
            isSelected = isSelected,
            pingMs = pingMs,
            subscriptionUrl = subscriptionUrl,
            rawUri = rawUri
        )
    }

    companion object {
        fun fromDomainModel(profile: V2RayProfile): ProfileEntity {
            return ProfileEntity(
                id = profile.id,
                remark = profile.remark,
                address = profile.address,
                port = profile.port,
                protocol = profile.protocol.scheme,
                uuidOrPassword = profile.uuidOrPassword,
                security = profile.security,
                network = profile.network,
                path = profile.path,
                host = profile.host,
                sni = profile.sni,
                alterId = profile.alterId,
                isTls = profile.isTls,
                isReality = profile.isReality,
                publicKey = profile.publicKey,
                shortId = profile.shortId,
                fingerprint = profile.fingerprint,
                isSelected = profile.isSelected,
                pingMs = profile.pingMs,
                subscriptionUrl = profile.subscriptionUrl,
                rawUri = profile.rawUri
            )
        }
    }
}

@Dao
interface ProfileDao {
    @Query("SELECT * FROM profiles ORDER BY remark ASC")
    fun getAllProfiles(): Flow<List<ProfileEntity>>

    @Query("SELECT * FROM profiles WHERE isSelected = 1 LIMIT 1")
    suspend fun getSelectedProfile(): ProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ProfileEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfiles(profiles: List<ProfileEntity>)

    @Query("UPDATE profiles SET isSelected = CASE WHEN id = :selectedId THEN 1 ELSE 0 END")
    suspend fun selectProfile(selectedId: String)

    @Query("UPDATE profiles SET pingMs = :pingMs WHERE id = :id")
    suspend fun updatePing(id: String, pingMs: Int)

    @Delete
    suspend fun deleteProfile(profile: ProfileEntity)

    @Query("DELETE FROM profiles WHERE subscriptionUrl = :subUrl")
    suspend fun deleteSubscriptionProfiles(subUrl: String)

    @Query("DELETE FROM profiles")
    suspend fun clearAll()
}
